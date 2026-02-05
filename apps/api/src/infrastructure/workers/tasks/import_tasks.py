"""Celery tasks for importing bank statements."""

import asyncio
import base64
import csv
import io
import uuid
from datetime import datetime
from decimal import Decimal, InvalidOperation
from src.infrastructure.workers.celery_app import celery_app


async def _import_statement(user_id: str, account_id: str, file_bytes: bytes, file_type: str):
    """Async bank statement import logic."""
    from src.infrastructure.database.connection import get_standalone_session
    from src.infrastructure.repositories.transaction_repository_impl import TransactionRepositoryImpl
    from src.domain.entities import Transaction, TransactionStatus

    # Parse CSV (most common format)
    transactions = []
    if file_type.upper() == "CSV":
        text_content = file_bytes.decode("utf-8")
        reader = csv.DictReader(io.StringIO(text_content))
        for row in reader:
            # Common CSV columns: date, description, amount, (category)
            date_str = row.get("date", row.get("Date", ""))
            description = row.get("description", row.get("Description", row.get("libelle", "")))
            amount_str = row.get("amount", row.get("Amount", row.get("montant", "0")))

            try:
                amount = Decimal(amount_str.replace(",", ".").replace(" ", ""))
                tx_date = datetime.strptime(date_str.strip(), "%Y-%m-%d") if date_str else datetime.utcnow()
            except (ValueError, InvalidOperation):
                continue

            transactions.append(Transaction(
                id=str(uuid.uuid4()),
                user_id=user_id,
                account_id=account_id,
                amount=amount,
                date=tx_date,
                description=description.strip(),
                status=TransactionStatus.COMPLETED,
                is_manual=False,
            ))

    if not transactions:
        return {"status": "success", "transactions_imported": 0}

    async with get_standalone_session() as db:
        tx_repo = TransactionRepositoryImpl(db)
        for tx in transactions:
            await tx_repo.create(tx)

    return {
        "status": "success",
        "transactions_imported": len(transactions),
    }


@celery_app.task(name="import_bank_statement", bind=True)
def import_bank_statement_task(
    self,
    user_id: str,
    account_id: str,
    file_data: str,
    file_type: str,
    file_name: str,
):
    """Background task to import and parse bank statement."""
    try:
        file_bytes = base64.b64decode(file_data)
        result = asyncio.run(_import_statement(user_id, account_id, file_bytes, file_type))

        # Trigger budget evaluation after import
        if result.get("transactions_imported", 0) > 0:
            from src.infrastructure.workers.tasks.budget_tasks import evaluate_budget_thresholds_task
            evaluate_budget_thresholds_task.delay(user_id)

        return result
    except Exception as e:
        self.retry(exc=e, countdown=60, max_retries=3)
