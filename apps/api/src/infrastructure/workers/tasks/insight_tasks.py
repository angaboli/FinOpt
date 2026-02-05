"""Celery tasks for AI insights generation."""

import asyncio
from src.infrastructure.workers.celery_app import celery_app


async def _generate_insights(user_id: str, month_year: str):
    """Async insight generation logic."""
    from src.infrastructure.database.connection import get_standalone_session
    from src.infrastructure.repositories.transaction_repository_impl import TransactionRepositoryImpl
    from src.infrastructure.repositories.account_repository_impl import AccountRepositoryImpl
    from src.infrastructure.repositories.budget_repository_impl import BudgetRepositoryImpl
    from src.infrastructure.repositories.insight_repository_impl import InsightRepositoryImpl
    from src.infrastructure.repositories.notification_repository_impl import (
        NotificationRepositoryImpl,
        NotificationPreferencesRepositoryImpl,
    )
    from src.infrastructure.services.llm_client_impl import AnthropicLLMClient
    from src.infrastructure.services.push_notification_impl import ExpoPushNotificationService
    from src.application.use_cases.insight_use_cases import GenerateMonthlyInsightsUseCase

    async with get_standalone_session() as db:
        use_case = GenerateMonthlyInsightsUseCase(
            transaction_repo=TransactionRepositoryImpl(db),
            account_repo=AccountRepositoryImpl(db),
            budget_repo=BudgetRepositoryImpl(db),
            insight_repo=InsightRepositoryImpl(db),
            notification_repo=NotificationRepositoryImpl(db),
            notification_prefs_repo=NotificationPreferencesRepositoryImpl(db),
            llm_client=AnthropicLLMClient(),
            push_service=ExpoPushNotificationService(),
        )
        insight = await use_case.execute(user_id, month_year)
        return {
            "status": "success",
            "insight_id": insight.id,
            "month_year": month_year,
        }


@celery_app.task(name="generate_monthly_insights", bind=True)
def generate_monthly_insights_task(self, user_id: str, month_year: str):
    """Background task to generate monthly AI insights."""
    try:
        return asyncio.run(_generate_insights(user_id, month_year))
    except Exception as e:
        self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(name="schedule_monthly_insights")
def schedule_monthly_insights_task():
    """Scheduled task to generate insights for all users (celery beat)."""
    from src.infrastructure.database.connection import get_standalone_session
    from sqlalchemy import text
    from datetime import datetime

    now = datetime.utcnow()
    month_year = f"{now.year}-{now.month:02d}"

    async def _get_user_ids():
        async with get_standalone_session() as db:
            result = await db.execute(
                text("SELECT DISTINCT user_id FROM transactions")
            )
            return [str(row[0]) for row in result.fetchall()]

    user_ids = asyncio.run(_get_user_ids())
    for uid in user_ids:
        generate_monthly_insights_task.delay(uid, month_year)

    return {"status": "success", "users_scheduled": len(user_ids), "month_year": month_year}
