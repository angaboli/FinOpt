from __future__ import annotations

import json
import re
from datetime import date as DateType
from decimal import Decimal

import openai

from src.application.budget_advice.dtos import BudgetAdviceResult, GenerateBudgetAdviceCommand
from src.domain.entities.transaction import TransactionType
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

### Revenus réguliers
{income_section}

### Transactions du mois
- Revenus ce mois : {monthly_income} €
- Dépenses ce mois : {monthly_expenses} €
- Solde net : {net} €

### Budget vs réel par catégorie
{budget_section}

### Objectifs d'épargne
{goals_section}

---
Réponds UNIQUEMENT avec un JSON valide (sans markdown) selon ce schéma exact :
{{"summary": "1-2 phrases de résumé", "tips": ["conseil 1", "conseil 2", "conseil 3"], "savings_advice": "conseil épargne ou null", "sentiment": "positive"}}

- summary : analyse concise de la situation financière du mois
- tips : 3 conseils concrets et actionnables adaptés aux données
- savings_advice : conseil sur les objectifs d'épargne, ou null si aucun objectif
- sentiment : "positive" si la situation est globalement bonne, "negative" si elle est préoccupante, "neutral" sinon
"""


def _fmt(amount: Decimal) -> str:
    return f"{amount:,.2f}".replace(",", " ").replace(".", ",")


def _build_prompt(
    year: int,
    month: int,
    income_sources: list,
    transactions: list,
    budget: object | None,
    goals: list,
) -> str:
    period = f"{_MONTHS_FR[month]} {year}"

    # Income sources
    if income_sources:
        income_section = "\n".join(
            f"- {s.name} : {_fmt(s.amount)} € ({s.frequency.value})" for s in income_sources
        )
    else:
        income_section = "Aucun revenu régulier enregistré"

    # Monthly totals
    month_prefix = f"{year}-{month:02d}"
    monthly_income = sum(
        t.amount for t in transactions
        if t.transaction_type == TransactionType.INCOME and t.date.isoformat().startswith(month_prefix)
    )
    monthly_expenses = sum(
        t.amount for t in transactions
        if t.transaction_type == TransactionType.EXPENSE and t.date.isoformat().startswith(month_prefix)
    )
    net = monthly_income - monthly_expenses

    # Budget section
    if budget and budget.lines:  # type: ignore[union-attr]
        budget_lines = []
        for line in budget.lines:  # type: ignore[union-attr]
            actual = sum(
                t.amount for t in transactions
                if t.transaction_type == TransactionType.EXPENSE
                and t.category_id == line.category_id
                and t.date.isoformat().startswith(month_prefix)
            )
            pct = int(actual / line.planned_amount * 100) if line.planned_amount > 0 else 0
            budget_lines.append(
                f"- Prévu {_fmt(line.planned_amount)} € / Réel {_fmt(actual)} € ({pct}%)"
            )
        budget_section = "\n".join(budget_lines)
    else:
        budget_section = "Aucun budget défini pour ce mois"

    # Goals section
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
        monthly_income=_fmt(monthly_income),
        monthly_expenses=_fmt(monthly_expenses),
        net=_fmt(net),
        budget_section=budget_section,
        goals_section=goals_section,
    )


def _parse_advice_response(text: str) -> tuple[str, list[str], str | None, str]:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    raw = match.group(0) if match else text
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return (text.strip(), [], None, "neutral")

    summary = str(data.get("summary", ""))
    tips = [str(t) for t in data.get("tips", [])]
    savings_advice = data.get("savings_advice") or None
    sentiment = str(data.get("sentiment", "neutral"))
    if sentiment not in ("positive", "negative", "neutral"):
        sentiment = "neutral"
    return summary, tips, savings_advice, sentiment


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

        from_date = DateType(cmd.year, cmd.month, 1)
        import calendar
        last_day = calendar.monthrange(cmd.year, cmd.month)[1]
        to_date = DateType(cmd.year, cmd.month, last_day)

        txs, budget, incomes, goals = await _gather(
            self._transactions, self._budgets, self._income_sources, self._goals,
            user_id, cmd.year, cmd.month, from_date, to_date,
        )

        prompt = _build_prompt(cmd.year, cmd.month, incomes, txs, budget, goals)

        client = openai.OpenAI(api_key=self._settings.openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = response.choices[0].message.content or ""
        summary, tips, savings_advice, sentiment = _parse_advice_response(response_text)

        period_label = f"{_MONTHS_FR[cmd.month].capitalize()} {cmd.year}"
        return BudgetAdviceResult(
            summary=summary,
            tips=tips,
            savings_advice=savings_advice,
            period_label=period_label,
            sentiment=sentiment,
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
) -> tuple:
    from src.domain.value_objects import AccountId, CategoryId

    txs = await transactions.list_by_user(
        user_id=user_id,
        account_id=None,
        category_id=None,
        from_date=from_date,
        to_date=to_date,
        limit=200,
        offset=0,
    )
    budget = await budgets.get_by_month(user_id, year, month)
    incomes = await income_sources.list_by_user(user_id)
    goal_list = await goals.list_by_user(user_id)
    return txs, budget, incomes, goal_list
