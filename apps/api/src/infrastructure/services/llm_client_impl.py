"""LLM client implementation using Anthropic Claude API."""

from typing import List, Dict, Any
import json
from anthropic import AsyncAnthropic

from src.domain.entities import Transaction, Account, Budget
from src.domain.services import LLMClientPort
from src.config import settings


class AnthropicLLMClient(LLMClientPort):
    """Anthropic Claude client for AI insights."""

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self.model = settings.anthropic_model

    async def generate_insights(
        self,
        transactions: List[Transaction],
        accounts: List[Account],
        budgets: List[Budget],
        month_year: str,
        income_estimate: float,
        fixed_costs_estimate: float,
    ) -> Dict[str, Any]:
        """Generate financial insights using Claude API."""

        # Prepare context
        context = self._prepare_context(
            transactions, accounts, budgets, month_year, income_estimate, fixed_costs_estimate
        )

        # Create prompt
        prompt = self._create_prompt(context)

        # Call Claude API
        try:
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=0.7,
                messages=[{"role": "user", "content": prompt}],
            )

            # Extract JSON response
            response_text = message.content[0].text

            # Try to extract JSON from markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            insights = json.loads(response_text)

            # Ensure required fields
            insights.setdefault("month", month_year)
            insights.setdefault("currency", "EUR")
            insights.setdefault("income_estimate", income_estimate)
            insights.setdefault("fixed_costs_estimate", fixed_costs_estimate)
            insights.setdefault("savings_opportunities", [])
            insights.setdefault("saving_strategies", [])
            insights.setdefault("subscriptions", [])
            insights.setdefault("anomalies", [])
            insights.setdefault("budget_adjustments", [])
            insights.setdefault("avoid_spending_triggers", [])
            insights.setdefault("next_actions", [])

            return insights

        except Exception as e:
            # Fallback to basic insights if AI fails
            return self._generate_fallback_insights(
                transactions, month_year, income_estimate, fixed_costs_estimate
            )

    def _prepare_context(
        self,
        transactions: List[Transaction],
        accounts: List[Account],
        budgets: List[Budget],
        month_year: str,
        income_estimate: float,
        fixed_costs_estimate: float,
    ) -> Dict[str, Any]:
        """Prepare context data for the LLM."""

        # Summarize transactions
        transactions_data = []
        for t in transactions:
            transactions_data.append({
                "date": t.date.isoformat(),
                "amount": float(t.amount),
                "description": t.description,
                "merchant": t.merchant_name,
                "category_id": t.category_id,
                "is_recurring": t.is_recurring,
            })

        # Summarize accounts
        accounts_data = []
        for a in accounts:
            accounts_data.append({
                "name": a.name,
                "type": a.type.value,
                "owner_scope": a.owner_scope.value,
                "balance": float(a.balance),
            })

        # Summarize budgets
        budgets_data = []
        for b in budgets:
            budgets_data.append({
                "category_id": b.category_id,
                "amount": float(b.amount),
                "period": f"{b.period_start} to {b.period_end}",
            })

        return {
            "month_year": month_year,
            "income_estimate": income_estimate,
            "fixed_costs_estimate": fixed_costs_estimate,
            "transactions": transactions_data,
            "accounts": accounts_data,
            "budgets": budgets_data,
            "transaction_count": len(transactions),
        }

    def _create_prompt(self, context: Dict[str, Any]) -> str:
        """Create the prompt for Claude."""

        return f"""Tu es un expert en finances personnelles et professionnelles. Analyse les données financières suivantes et génère des insights actionnables.

**Contexte:**
- Mois: {context["month_year"]}
- Revenus estimés: {context["income_estimate"]:.2f}€
- Charges fixes estimées: {context["fixed_costs_estimate"]:.2f}€
- Nombre de transactions: {context["transaction_count"]}

**Transactions:**
{json.dumps(context["transactions"][:100], indent=2, ensure_ascii=False)}

**Comptes:**
{json.dumps(context["accounts"], indent=2, ensure_ascii=False)}

**Budgets définis:**
{json.dumps(context["budgets"], indent=2, ensure_ascii=False)}

**Instructions:**
1. Analyse les patterns de dépenses
2. Identifie les abonnements récurrents
3. Détecte les anomalies (dépenses inhabituelles)
4. Propose des stratégies d'épargne adaptées au revenu
5. Suggère des ajustements de budget
6. Identifie les "triggers" de dépenses impulsives (jours, horaires, marchands)
7. Distingue bien les types de comptes (épargne, courant, professionnel) dans ton analyse

**Format de réponse (JSON strict):**
```json
{{
  "month": "{context["month_year"]}",
  "currency": "EUR",
  "income_estimate": {context["income_estimate"]},
  "fixed_costs_estimate": {context["fixed_costs_estimate"]},
  "savings_opportunities": [
    {{
      "title": "Titre concis",
      "estimated_monthly_saving": 80.0,
      "confidence": 0.75,
      "evidence": ["Fait 1", "Fait 2"]
    }}
  ],
  "saving_strategies": [
    {{
      "strategy": "Épargne automatique 10%",
      "amount": 300.0,
      "why": "Marge confortable après charges fixes",
      "confidence": 0.8
    }}
  ],
  "subscriptions": [
    {{
      "merchant": "Netflix",
      "amount": 13.49,
      "period": "monthly",
      "confidence": 0.9
    }}
  ],
  "anomalies": [
    {{
      "title": "Titre",
      "description": "Description",
      "amount": 500.0,
      "date": "2024-01-15",
      "severity": "MEDIUM",
      "confidence": 0.7
    }}
  ],
  "budget_adjustments": [
    {{
      "category": "Restaurants",
      "action": "decrease",
      "amount": 50.0,
      "reason": "Dépassement récurrent"
    }}
  ],
  "avoid_spending_triggers": [
    {{
      "pattern": "Achats en ligne le soir",
      "description": "7 achats entre 21h-23h",
      "frequency": 7,
      "total_amount": 320.0,
      "advice": "Désactiver notifications shopping après 20h"
    }}
  ],
  "next_actions": [
    "Action 1 concrète",
    "Action 2 concrète"
  ]
}}
```

Réponds UNIQUEMENT avec le JSON, sans texte additionnel."""

    def _generate_fallback_insights(
        self,
        transactions: List[Transaction],
        month_year: str,
        income_estimate: float,
        fixed_costs_estimate: float,
    ) -> Dict[str, Any]:
        """Generate basic fallback insights if AI fails."""

        total_expenses = sum(abs(float(t.amount)) for t in transactions if t.amount < 0)
        margin = income_estimate - fixed_costs_estimate - total_expenses

        return {
            "month": month_year,
            "currency": "EUR",
            "income_estimate": income_estimate,
            "fixed_costs_estimate": fixed_costs_estimate,
            "savings_opportunities": [
                {
                    "title": "Analyse vos dépenses",
                    "estimated_monthly_saving": 0,
                    "confidence": 0.5,
                    "evidence": ["Données insuffisantes pour une analyse détaillée"],
                }
            ],
            "saving_strategies": [
                {
                    "strategy": f"Épargne de {max(0, margin * 0.1):.0f}€ par mois",
                    "amount": max(0, margin * 0.1),
                    "why": "10% de votre marge disponible",
                    "confidence": 0.6,
                }
            ],
            "subscriptions": [],
            "anomalies": [],
            "budget_adjustments": [],
            "avoid_spending_triggers": [],
            "next_actions": [
                "Continuez à enregistrer vos transactions",
                "Définissez des budgets par catégorie",
            ],
        }
