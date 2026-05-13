from __future__ import annotations

import json
import re
from collections import defaultdict
from datetime import date as DateType
from decimal import Decimal

import openai

from src.application.budget_advice.dtos import (
    BudgetAdviceResult,
    GenerateBudgetAdviceCommand,
    MerchantPlanItem,
)
from src.domain.entities.budget import Budget as BudgetEntity
from src.domain.entities.income_source import IncomeSource
from src.domain.entities.savings_goal import SavingsGoal
from src.domain.entities.transaction import Transaction, TransactionType
from src.domain.exceptions import InvalidReceiptError
from src.domain.ports.repositories import (
    BudgetRepository,
    IncomeSourceRepository,
    SavingsGoalRepository,
    TransactionRepository,
)
from src.domain.value_objects import UserId
from src.infrastructure.settings import Settings

_MONTHS_FR = [
    "", "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]

_PROMPT_TEMPLATE = """
Tu es un conseiller financier personnel bienveillant et pragmatique.
Analyse les données financières ci-dessous et génère des conseils personnalisés en français.

## Données financières — {period}

### Revenus réguliers enregistrés
{income_section}

### Tendances sur les 6 derniers mois
{trend_section}

### Mois courant ({period})
- Revenus : {monthly_income} €  (moyenne mensuelle sur 6 mois : {avg_income} €)
- Dépenses variables : {variable_expenses} €
- Dépenses fixes (abonnements) : {subscription_expenses} € — {subscription_count} abonnement(s)
- Total dépenses : {monthly_expenses} €
- Solde net : {net} €
{income_alert}

### Abonnements actifs détectés (charges fixes récurrentes)
{subscription_section}

### Budget vs réel par catégorie
{budget_section}

### Fréquence d'achat par enseigne/article — dépenses variables uniquement (6 mois)
{merchant_section}

### Objectifs d'épargne
{goals_section}

---
Réponds UNIQUEMENT avec un JSON valide (sans markdown) selon ce schéma exact :
{{"summary": "1-2 phrases de résumé", "tips": ["conseil 1", "conseil 2", "conseil 3"], "savings_advice": "conseil épargne ou null", "cut_suggestions": ["dépense à couper 1", "dépense à couper 2"], "merchant_plan": [{{"merchant": "Enseigne", "items": ["article 1", "article 2"], "reason": "raison courte"}}], "sentiment": "positive"}}

- summary : analyse concise distinguant charges fixes (abonnements) et dépenses variables
- tips : 3 conseils concrets. Si les abonnements représentent plus de 30% des dépenses totales, inclure au moins un conseil sur leur optimisation. Si les revenus baissent, prioriser les abonnements non essentiels à couper.
- savings_advice : conseil sur les objectifs d'épargne, ou null si aucun objectif
- cut_suggestions : abonnements ou dépenses variables spécifiques à réduire/supprimer — mentionner le libellé exact et le montant mensuel estimé. Prioriser les abonnements si les revenus sont insuffisants. Retourner [] si la situation est confortable.
- merchant_plan : plan d'optimisation des achats VARIABLES (exclure les abonnements). Regroupe les articles/enseignes habituels par magasin optimal. Retourner [] si moins de 3 enseignes différentes identifiées.
- sentiment : "positive" si la situation est globalement bonne, "negative" si elle est préoccupante, "neutral" sinon
"""


def _fmt(amount: Decimal | int | float) -> str:
    return f"{Decimal(str(amount)):,.2f}".replace(",", " ").replace(".", ",")


def _month_label(year: int, month: int) -> str:
    return f"{_MONTHS_FR[month]} {year}"


def _six_months_from(year: int, month: int) -> tuple[int, int]:
    m = month - 6
    y = year
    if m <= 0:
        m += 12
        y -= 1
    return y, m


def _build_prompt(
    year: int,
    month: int,
    income_sources: list[IncomeSource],
    all_transactions: list[Transaction],
    budget: BudgetEntity | None,
    goals: list[SavingsGoal],
) -> str:
    period = _month_label(year, month)
    month_prefix = f"{year}-{month:02d}"

    # --- income sources ---
    if income_sources:
        income_section = "\n".join(
            f"- {s.name} : {_fmt(s.amount)} € ({s.frequency.value})" for s in income_sources
        )
    else:
        income_section = "Aucun revenu régulier enregistré"

    # --- monthly totals per month over the full history ---
    monthly_income_map: dict[str, Decimal] = defaultdict(Decimal)
    monthly_expense_map: dict[str, Decimal] = defaultdict(Decimal)
    for tx in all_transactions:
        ym = tx.date.isoformat()[:7]
        if tx.transaction_type == TransactionType.INCOME:
            monthly_income_map[ym] += tx.amount
        else:
            monthly_expense_map[ym] += tx.amount

    all_months = sorted(set(list(monthly_income_map.keys()) + list(monthly_expense_map.keys())))
    trend_lines = []
    for ym in all_months:
        y_int, m_int = map(int, ym.split("-"))
        label = _month_label(y_int, m_int)
        inc = monthly_income_map.get(ym, Decimal(0))
        exp = monthly_expense_map.get(ym, Decimal(0))
        trend_lines.append(f"- {label}: revenus {_fmt(inc)} €, dépenses {_fmt(exp)} €")
    trend_section = "\n".join(trend_lines) if trend_lines else "Pas assez d'historique"

    # --- current month figures ---
    monthly_income = monthly_income_map.get(month_prefix, Decimal(0))
    monthly_expenses = monthly_expense_map.get(month_prefix, Decimal(0))
    net = monthly_income - monthly_expenses

    # --- subscription split for current month ---
    subscription_txs = [
        tx for tx in all_transactions
        if tx.is_subscription
        and tx.transaction_type == TransactionType.EXPENSE
        and tx.date.isoformat().startswith(month_prefix)
    ]
    subscription_expenses = Decimal(sum(tx.amount for tx in subscription_txs))
    variable_expenses = monthly_expenses - subscription_expenses

    # --- 6-month average income (excluding current month) ---
    past_months = [ym for ym in all_months if ym != month_prefix]
    if past_months:
        avg_income = Decimal(
            sum(monthly_income_map.get(ym, Decimal(0)) for ym in past_months)
        ) / Decimal(len(past_months))
    else:
        avg_income = monthly_income

    # Flag when income significantly below average
    if avg_income > Decimal(0) and monthly_income < avg_income * Decimal("0.9"):
        drop_pct = int((1 - monthly_income / avg_income) * 100)
        income_alert = f"⚠️ Revenu en baisse de {drop_pct}% par rapport à la moyenne — analyser les dépenses compressibles."
    else:
        income_alert = ""

    # --- budget section ---
    if budget is not None and budget.lines:
        budget_lines = []
        for line in budget.lines:
            actual = Decimal(sum(
                tx.amount for tx in all_transactions
                if tx.transaction_type == TransactionType.EXPENSE
                and tx.category_id == line.category_id
                and tx.date.isoformat().startswith(month_prefix)
            ))
            pct = int(actual / line.planned_amount * 100) if line.planned_amount > 0 else 0
            budget_lines.append(
                f"- Prévu {_fmt(line.planned_amount)} € / Réel {_fmt(actual)} € ({pct}%)"
            )
        budget_section = "\n".join(budget_lines)
    else:
        budget_section = "Aucun budget défini pour ce mois"

    # --- subscription section (all unique subscriptions seen over 6 months) ---
    all_subscriptions: dict[str, list[Decimal]] = defaultdict(list)
    for tx in all_transactions:
        if tx.is_subscription and tx.transaction_type == TransactionType.EXPENSE:
            all_subscriptions[tx.title.strip()].append(tx.amount)

    if all_subscriptions:
        sub_lines = []
        for name, amounts in sorted(all_subscriptions.items()):
            avg_sub = Decimal(sum(amounts)) / Decimal(len(amounts))
            sub_lines.append(f"- {name} : ~{_fmt(avg_sub)} €/mois ({len(amounts)} occurrence(s))")
        subscription_section = "\n".join(sub_lines)
    else:
        subscription_section = "Aucun abonnement enregistré"

    # --- merchant frequency analysis (variable EXPENSE transactions only) ---
    merchant_map: dict[str, list[Decimal]] = defaultdict(list)
    for tx in all_transactions:
        if tx.transaction_type == TransactionType.EXPENSE and not tx.is_subscription:
            merchant_map[tx.title.strip()].append(tx.amount)

    merchant_stats = [
        (name, len(amounts), Decimal(sum(amounts)), Decimal(sum(amounts)) / Decimal(len(amounts)))
        for name, amounts in merchant_map.items()
    ]
    merchant_stats.sort(key=lambda x: (-x[1], -x[2]))
    merchant_lines = [
        f"- {name}: {count} fois, total {_fmt(total)} €, moyenne {_fmt(avg)} €/achat"
        for name, count, total, avg in merchant_stats[:25]
    ]
    merchant_section = "\n".join(merchant_lines) if merchant_lines else "Aucune dépense enregistrée"

    # --- goals ---
    if goals:
        goals_section = "\n".join(
            f"- {g.name} : {_fmt(g.current_amount)} € / {_fmt(g.target_amount)} €"
            f" ({int(g.progress_ratio * 100)}%)"
            + (f", échéance {g.deadline}" if g.deadline else "")
            for g in goals
        )
    else:
        goals_section = "Aucun objectif d'épargne défini"

    return _PROMPT_TEMPLATE.format(
        period=period,
        income_section=income_section,
        trend_section=trend_section,
        monthly_income=_fmt(monthly_income),
        avg_income=_fmt(avg_income),
        variable_expenses=_fmt(variable_expenses),
        subscription_expenses=_fmt(subscription_expenses),
        subscription_count=len(subscription_txs),
        monthly_expenses=_fmt(monthly_expenses),
        net=_fmt(net),
        income_alert=income_alert,
        subscription_section=subscription_section,
        budget_section=budget_section,
        merchant_section=merchant_section,
        goals_section=goals_section,
    )


def _parse_advice_response(
    text: str,
) -> tuple[str, list[str], str | None, str, list[str], list[MerchantPlanItem]]:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    raw = match.group(0) if match else text
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return (text.strip(), [], None, "neutral", [], [])

    summary = str(data.get("summary", ""))
    tips = [str(t) for t in data.get("tips", [])]
    savings_advice = data.get("savings_advice") or None
    sentiment = str(data.get("sentiment", "neutral"))
    if sentiment not in ("positive", "negative", "neutral"):
        sentiment = "neutral"

    cut_suggestions = [str(c) for c in data.get("cut_suggestions", [])]

    merchant_plan: list[MerchantPlanItem] = []
    for entry in data.get("merchant_plan", []):
        if isinstance(entry, dict) and entry.get("merchant"):
            merchant_plan.append(MerchantPlanItem(
                merchant=str(entry.get("merchant", "")),
                items=[str(i) for i in entry.get("items", [])],
                reason=str(entry.get("reason", "")),
            ))

    return summary, tips, savings_advice, sentiment, cut_suggestions, merchant_plan


class GenerateBudgetAdvice:
    def __init__(
        self,
        settings: Settings,
        transactions: TransactionRepository,
        budgets: BudgetRepository,
        income_sources: IncomeSourceRepository,
        goals: SavingsGoalRepository,
    ) -> None:
        self._settings = settings
        self._transactions = transactions
        self._budgets = budgets
        self._income_sources = income_sources
        self._goals = goals

    async def execute(self, cmd: GenerateBudgetAdviceCommand) -> BudgetAdviceResult:
        if not self._settings.openai_api_key:
            raise InvalidReceiptError("OpenAI API key not configured")

        user_id = UserId.from_string(cmd.user_id)

        import calendar
        last_day = calendar.monthrange(cmd.year, cmd.month)[1]
        to_date = DateType(cmd.year, cmd.month, last_day)

        hist_year, hist_month = _six_months_from(cmd.year, cmd.month)
        hist_from = DateType(hist_year, hist_month, 1)

        txs, budget, incomes, goals = await _gather(
            self._transactions, self._budgets, self._income_sources, self._goals,
            user_id, cmd.year, cmd.month, hist_from, to_date,
        )

        prompt = _build_prompt(cmd.year, cmd.month, incomes, txs, budget, goals)

        client = openai.OpenAI(api_key=self._settings.openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = response.choices[0].message.content or ""
        summary, tips, savings_advice, sentiment, cut_suggestions, merchant_plan = _parse_advice_response(response_text)

        period_label = f"{_MONTHS_FR[cmd.month].capitalize()} {cmd.year}"
        return BudgetAdviceResult(
            summary=summary,
            tips=tips,
            savings_advice=savings_advice,
            period_label=period_label,
            sentiment=sentiment,
            cut_suggestions=cut_suggestions,
            merchant_plan=merchant_plan,
        )


async def _gather(
    transactions: TransactionRepository,
    budgets: BudgetRepository,
    income_sources: IncomeSourceRepository,
    goals: SavingsGoalRepository,
    user_id: UserId,
    year: int,
    month: int,
    from_date: DateType,
    to_date: DateType,
) -> tuple[list[Transaction], BudgetEntity | None, list[IncomeSource], list[SavingsGoal]]:
    txs = await transactions.list_by_user(
        user_id=user_id,
        account_id=None,
        category_id=None,
        from_date=from_date,
        to_date=to_date,
        limit=500,
        offset=0,
    )
    budget = await budgets.get_by_month(user_id, year, month)
    incomes = await income_sources.list_by_user(user_id)
    goal_list = await goals.list_by_user(user_id)
    return txs, budget, incomes, goal_list
