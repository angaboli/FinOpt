"""Insight use cases - AI-powered financial insights."""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from src.domain.entities import InsightRecord, Notification, NotificationType
from src.domain.repositories import (
    TransactionRepository,
    AccountRepository,
    BudgetRepository,
    InsightRepository,
    NotificationRepository,
    NotificationPreferencesRepository,
)
from src.domain.services import LLMClientPort, PushNotificationPort


class GenerateMonthlyInsightsUseCase:
    """Use case for generating AI-powered monthly insights."""

    def __init__(
        self,
        transaction_repo: TransactionRepository,
        account_repo: AccountRepository,
        budget_repo: BudgetRepository,
        insight_repo: InsightRepository,
        notification_repo: NotificationRepository,
        notification_prefs_repo: NotificationPreferencesRepository,
        llm_client: LLMClientPort,
        push_service: Optional[PushNotificationPort] = None,
    ):
        self.transaction_repo = transaction_repo
        self.account_repo = account_repo
        self.budget_repo = budget_repo
        self.insight_repo = insight_repo
        self.notification_repo = notification_repo
        self.notification_prefs_repo = notification_prefs_repo
        self.llm_client = llm_client
        self.push_service = push_service

    async def execute(self, user_id: str, month_year: str) -> InsightRecord:
        """
        Generate insights for a specific month (format: YYYY-MM).

        Steps:
        1. Fetch all transactions for the month
        2. Fetch accounts to understand account types
        3. Fetch budgets for context
        4. Calculate income and fixed costs estimates
        5. Send to LLM for analysis
        6. Save insights
        7. Notify user
        """

        # Check if insights already exist
        existing = await self.insight_repo.get_by_month(user_id, month_year)
        if existing:
            # Regenerate by creating new insights
            pass

        # Parse month_year
        year, month = map(int, month_year.split("-"))
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1) - timedelta(seconds=1)
        else:
            end_date = datetime(year, month + 1, 1) - timedelta(seconds=1)

        # Fetch data
        filters = {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
        }
        transactions, _ = await self.transaction_repo.list_by_user(
            user_id=user_id,
            filters=filters,
            page=1,
            limit=10000,  # Get all for the month
        )

        if len(transactions) < 5:
            raise ValueError(f"Insufficient transactions ({len(transactions)}) for insights generation")

        # Fetch accounts
        accounts = await self.account_repo.list_by_user(user_id)

        # Fetch budgets
        budgets = await self.budget_repo.list_by_user(user_id, is_active=True)

        # Calculate estimates
        income_estimate = sum(
            t.amount for t in transactions
            if t.amount > 0 and t.status.value == "COMPLETED"
        )

        # Fixed costs: recurring transactions (simplified)
        fixed_costs_estimate = sum(
            abs(t.amount) for t in transactions
            if t.amount < 0 and t.is_recurring and t.status.value == "COMPLETED"
        )

        # Generate insights using LLM
        insight_data = await self.llm_client.generate_insights(
            transactions=transactions,
            accounts=accounts,
            budgets=budgets,
            month_year=month_year,
            income_estimate=float(income_estimate),
            fixed_costs_estimate=float(fixed_costs_estimate),
        )

        # Create insight record
        insight = InsightRecord(
            id=str(uuid.uuid4()),
            user_id=user_id,
            month_year=month_year,
            data=insight_data,
            income_estimate=income_estimate,
            fixed_costs_estimate=fixed_costs_estimate,
        )
        insight = await self.insight_repo.create(insight)

        # Create notification
        prefs = await self.notification_prefs_repo.get_by_user(user_id)
        if prefs and prefs.insights_enabled:
            notification = Notification(
                id=str(uuid.uuid4()),
                user_id=user_id,
                type=NotificationType.INSIGHT_READY,
                title="Vos insights sont prêts",
                body=f"Découvrez vos insights financiers pour {month_year}",
                data={
                    "insight_id": insight.id,
                    "month_year": month_year,
                },
            )
            notification = await self.notification_repo.create(notification)

            # Send push notification
            if self.push_service and prefs.push_token:
                try:
                    await self.push_service.send_notification(
                        push_token=prefs.push_token,
                        title=notification.title,
                        body=notification.body,
                        data=notification.data,
                    )
                    notification.mark_as_sent()
                    await self.notification_repo.create(notification)
                except Exception as e:
                    print(f"Failed to send push notification: {e}")

        return insight


class GetInsightsUseCase:
    """Use case for retrieving insights."""

    def __init__(self, insight_repo: InsightRepository):
        self.insight_repo = insight_repo

    async def execute(self, user_id: str, month_year: str) -> Optional[InsightRecord]:
        """Get insights for a specific month."""
        return await self.insight_repo.get_by_month(user_id, month_year)


class ListInsightsUseCase:
    """Use case for listing insights history."""

    def __init__(self, insight_repo: InsightRepository):
        self.insight_repo = insight_repo

    async def execute(self, user_id: str, limit: int = 12) -> List[InsightRecord]:
        """List insights for a user."""
        return await self.insight_repo.list_by_user(user_id, limit)
