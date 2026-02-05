"""Celery tasks for budget evaluation and notifications."""

import asyncio
import uuid
from src.infrastructure.workers.celery_app import celery_app


async def _evaluate_budgets(user_id: str, category_ids: list = None):
    """Async budget evaluation logic."""
    from src.infrastructure.database.connection import get_standalone_session
    from src.infrastructure.repositories.budget_repository_impl import BudgetRepositoryImpl
    from src.infrastructure.repositories.notification_repository_impl import (
        NotificationRepositoryImpl,
        NotificationPreferencesRepositoryImpl,
    )
    from src.domain.entities import Notification, NotificationType

    async with get_standalone_session() as db:
        budget_repo = BudgetRepositoryImpl(db)
        notif_repo = NotificationRepositoryImpl(db)
        prefs_repo = NotificationPreferencesRepositoryImpl(db)

        budgets = await budget_repo.list_by_user(user_id, is_active=True)
        if category_ids:
            budgets = [b for b in budgets if b.category_id in category_ids]

        prefs = await prefs_repo.get_by_user(user_id)
        if prefs and not prefs.budget_warnings_enabled:
            return {"status": "skipped", "reason": "notifications_disabled"}

        alerts = []
        for budget in budgets:
            consumption = await budget_repo.get_consumption(budget.id, user_id)
            if not consumption:
                continue

            spent = float(consumption.get("spent", 0))
            amount = float(budget.amount)
            if amount <= 0:
                continue

            pct = spent / amount
            warning_threshold = float(budget.warning_threshold)
            critical_threshold = float(budget.critical_threshold)

            if pct >= critical_threshold:
                notif = Notification(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    type=NotificationType.BUDGET_EXCEEDED,
                    title="Budget dépassé",
                    body=f"Vous avez dépassé votre budget ({pct:.0%})",
                    data={"budget_id": budget.id, "percentage": round(pct * 100)},
                )
                await notif_repo.create(notif)
                alerts.append({"budget_id": budget.id, "level": "exceeded"})
            elif pct >= warning_threshold:
                notif = Notification(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    type=NotificationType.BUDGET_WARNING,
                    title="Alerte budget",
                    body=f"Vous avez utilisé {pct:.0%} de votre budget",
                    data={"budget_id": budget.id, "percentage": round(pct * 100)},
                )
                await notif_repo.create(notif)
                alerts.append({"budget_id": budget.id, "level": "warning"})

        return {"status": "success", "alerts_created": len(alerts)}


@celery_app.task(name="evaluate_budget_thresholds", bind=True)
def evaluate_budget_thresholds_task(self, user_id: str, category_ids: list = None):
    """Evaluate budget thresholds and send notifications."""
    try:
        return asyncio.run(_evaluate_budgets(user_id, category_ids))
    except Exception as e:
        self.retry(exc=e, countdown=30, max_retries=2)


@celery_app.task(name="daily_budget_check")
def daily_budget_check_task():
    """Daily task to check all active budgets (celery beat)."""
    from src.infrastructure.database.connection import get_standalone_session
    from sqlalchemy import text

    async def _get_user_ids():
        async with get_standalone_session() as db:
            result = await db.execute(
                text("SELECT DISTINCT user_id FROM budgets WHERE is_active = true")
            )
            return [str(row[0]) for row in result.fetchall()]

    user_ids = asyncio.run(_get_user_ids())
    for uid in user_ids:
        evaluate_budget_thresholds_task.delay(uid)

    return {"status": "success", "users_checked": len(user_ids)}
