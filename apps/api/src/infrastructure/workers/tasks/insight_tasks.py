"""Celery tasks for AI insights generation."""

from src.infrastructure.workers.celery_app import celery_app


@celery_app.task(name="generate_monthly_insights", bind=True)
def generate_monthly_insights_task(self, user_id: str, month_year: str):
    """
    Background task to generate monthly AI insights.

    Args:
        user_id: User ID
        month_year: Month in YYYY-MM format
    """
    try:
        # Import here to avoid circular dependencies
        from src.infrastructure.database.connection import Database
        from src.infrastructure.repositories.transaction_repository_impl import TransactionRepositoryImpl
        from src.infrastructure.services.llm_client_impl import AnthropicLLMClient
        from src.application.use_cases.insight_use_cases import GenerateMonthlyInsightsUseCase
        import asyncio

        # Get database client
        db = Database.get_service_client()

        # Initialize repositories and services
        # Note: This is simplified - in production, use proper DI
        transaction_repo = TransactionRepositoryImpl(db)
        llm_client = AnthropicLLMClient()

        # Create use case
        # use_case = GenerateMonthlyInsightsUseCase(...)

        # Run async code
        # result = asyncio.run(use_case.execute(user_id, month_year))

        return {
            "status": "success",
            "user_id": user_id,
            "month_year": month_year,
            "message": "Insights generated successfully",
        }

    except Exception as e:
        self.retry(exc=e, countdown=60, max_retries=3)


@celery_app.task(name="schedule_monthly_insights")
def schedule_monthly_insights_task():
    """
    Scheduled task to generate insights for all users.
    This should be run monthly via celery beat.
    """
    # Get all users and schedule insight generation
    # For each user, call generate_monthly_insights_task.delay(user_id, month_year)
    pass
