"""Celery tasks for importing bank statements."""

from src.infrastructure.workers.celery_app import celery_app


@celery_app.task(name="import_bank_statement", bind=True)
def import_bank_statement_task(
    self,
    user_id: str,
    account_id: str,
    file_data: str,
    file_type: str,
    file_name: str,
):
    """
    Background task to import and parse bank statement.

    Args:
        user_id: User ID
        account_id: Account ID
        file_data: Base64 encoded file data
        file_type: File type (CSV, OFX, PDF)
        file_name: Original file name
    """
    try:
        import base64
        import asyncio
        from src.infrastructure.database.connection import Database

        # Decode file
        file_bytes = base64.b64decode(file_data)

        db = Database.get_service_client()

        # Parse file based on type
        # parser = StatementParserImpl()
        # transactions = await parser.parse(file_bytes, file_type, account_id, user_id)

        # Import transactions
        # use_case = ImportStatementUseCase(...)
        # result = asyncio.run(use_case.execute(user_id, account_id, transactions))

        # After import, trigger budget evaluation
        from src.infrastructure.workers.tasks.budget_tasks import evaluate_budget_thresholds_task

        # Get unique category_ids from imported transactions
        category_ids = []  # Extract from transactions
        evaluate_budget_thresholds_task.delay(user_id, category_ids)

        return {
            "status": "success",
            "user_id": user_id,
            "account_id": account_id,
            "transactions_imported": 0,  # len(transactions)
        }

    except Exception as e:
        self.retry(exc=e, countdown=60, max_retries=3)
