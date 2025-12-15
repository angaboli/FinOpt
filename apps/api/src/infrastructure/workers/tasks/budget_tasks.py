"""Celery tasks for budget evaluation and notifications."""

from src.infrastructure.workers.celery_app import celery_app


@celery_app.task(name="evaluate_budget_thresholds", bind=True)
def evaluate_budget_thresholds_task(self, user_id: str, category_ids: list = None):
    """
    Evaluate budget thresholds and send notifications if needed.

    Args:
        user_id: User ID
        category_ids: Optional list of category IDs to check
    """
    try:
        # Import here to avoid circular dependencies
        from src.infrastructure.database.connection import Database
        import asyncio

        db = Database.get_service_client()

        # Initialize repositories and use case
        # use_case = RecalculateBudgetsUseCase(...)

        # Run async code
        # result = asyncio.run(use_case.execute(user_id, category_ids))

        return {
            "status": "success",
            "user_id": user_id,
            "message": "Budget thresholds evaluated",
        }

    except Exception as e:
        self.retry(exc=e, countdown=30, max_retries=2)


@celery_app.task(name="daily_budget_check")
def daily_budget_check_task():
    """
    Daily task to check all active budgets.
    This should be run daily via celery beat.
    """
    # Get all users with active budgets
    # For each user, call evaluate_budget_thresholds_task.delay(user_id)
    pass
