"""Transaction use cases - Application business logic."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
import uuid

from src.domain.entities import Transaction, TransactionStatus
from src.domain.repositories import TransactionRepository, AccountRepository, CategoryRepository
from src.domain.services import CategorizationPort


class CreateManualTransactionUseCase:
    """Use case for creating a manual transaction."""

    def __init__(
        self,
        transaction_repo: TransactionRepository,
        account_repo: AccountRepository,
        categorization_service: Optional[CategorizationPort] = None,
    ):
        self.transaction_repo = transaction_repo
        self.account_repo = account_repo
        self.categorization_service = categorization_service

    async def execute(
        self,
        user_id: str,
        account_id: str,
        amount: Decimal,
        date: datetime,
        description: str,
        category_id: Optional[str] = None,
        merchant_name: Optional[str] = None,
        notes: Optional[str] = None,
        tags: Optional[List[str]] = None,
    ) -> Transaction:
        """Create a manual transaction."""

        # Verify account belongs to user
        account = await self.account_repo.get_by_id(account_id, user_id)
        if not account:
            raise ValueError(f"Account {account_id} not found for user {user_id}")

        # Auto-categorize if no category provided
        if not category_id and self.categorization_service:
            category_id = await self.categorization_service.categorize_transaction(
                description=description,
                amount=float(amount),
                merchant_name=merchant_name,
            )

        # Create transaction
        transaction = Transaction(
            id=str(uuid.uuid4()),
            user_id=user_id,
            account_id=account_id,
            amount=amount,
            currency=account.currency,
            date=date,
            description=description,
            category_id=category_id,
            merchant_name=merchant_name,
            is_manual=True,
            status=TransactionStatus.COMPLETED,
            notes=notes,
            tags=tags or [],
        )

        # Save transaction
        transaction = await self.transaction_repo.create(transaction)

        # Update account balance
        new_balance = account.balance + amount
        await self.account_repo.update_balance(account_id, user_id, new_balance)

        return transaction


class UpdateTransactionUseCase:
    """Use case for updating a transaction."""

    def __init__(
        self,
        transaction_repo: TransactionRepository,
        account_repo: AccountRepository,
    ):
        self.transaction_repo = transaction_repo
        self.account_repo = account_repo

    async def execute(
        self,
        transaction_id: str,
        user_id: str,
        **updates: Any,
    ) -> Transaction:
        """Update a transaction."""

        # Get existing transaction
        transaction = await self.transaction_repo.get_by_id(transaction_id, user_id)
        if not transaction:
            raise ValueError(f"Transaction {transaction_id} not found")

        if not transaction.is_manual:
            raise ValueError("Only manual transactions can be updated")

        # Store old amount for balance adjustment
        old_amount = transaction.amount

        # Update fields
        for key, value in updates.items():
            if hasattr(transaction, key) and value is not None:
                setattr(transaction, key, value)

        transaction.updated_at = datetime.utcnow()

        # Save transaction
        transaction = await self.transaction_repo.update(transaction)

        # Update account balance if amount changed
        if "amount" in updates and updates["amount"] != old_amount:
            amount_diff = updates["amount"] - old_amount
            account = await self.account_repo.get_by_id(transaction.account_id, user_id)
            if account:
                new_balance = account.balance + amount_diff
                await self.account_repo.update_balance(transaction.account_id, user_id, new_balance)

        return transaction


class DeleteTransactionUseCase:
    """Use case for deleting a transaction (soft delete)."""

    def __init__(
        self,
        transaction_repo: TransactionRepository,
        account_repo: AccountRepository,
    ):
        self.transaction_repo = transaction_repo
        self.account_repo = account_repo

    async def execute(self, transaction_id: str, user_id: str) -> bool:
        """Soft delete a transaction."""

        # Get transaction
        transaction = await self.transaction_repo.get_by_id(transaction_id, user_id)
        if not transaction:
            raise ValueError(f"Transaction {transaction_id} not found")

        if not transaction.is_manual:
            raise ValueError("Only manual transactions can be deleted")

        # Soft delete
        success = await self.transaction_repo.soft_delete(transaction_id, user_id)

        if success:
            # Adjust account balance
            account = await self.account_repo.get_by_id(transaction.account_id, user_id)
            if account:
                new_balance = account.balance - transaction.amount
                await self.account_repo.update_balance(transaction.account_id, user_id, new_balance)

        return success


class ListTransactionsUseCase:
    """Use case for listing transactions with filters."""

    def __init__(self, transaction_repo: TransactionRepository):
        self.transaction_repo = transaction_repo

    async def execute(
        self,
        user_id: str,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[List[Transaction], int]:
        """List transactions for a user with filters."""
        return await self.transaction_repo.list_by_user(
            user_id=user_id,
            filters=filters,
            page=page,
            limit=limit,
        )


class GetTransactionUseCase:
    """Use case for getting a single transaction."""

    def __init__(self, transaction_repo: TransactionRepository):
        self.transaction_repo = transaction_repo

    async def execute(self, transaction_id: str, user_id: str) -> Optional[Transaction]:
        """Get a transaction by ID."""
        return await self.transaction_repo.get_by_id(transaction_id, user_id)


class ImportStatementUseCase:
    """Use case for importing bank statements."""

    def __init__(
        self,
        transaction_repo: TransactionRepository,
        account_repo: AccountRepository,
        categorization_service: Optional[CategorizationPort] = None,
    ):
        self.transaction_repo = transaction_repo
        self.account_repo = account_repo
        self.categorization_service = categorization_service

    async def execute(
        self,
        user_id: str,
        account_id: str,
        transactions: List[Transaction],
    ) -> List[Transaction]:
        """
        Import transactions from parsed statement.
        This use case receives already-parsed transactions from a worker.
        """

        # Verify account
        account = await self.account_repo.get_by_id(account_id, user_id)
        if not account:
            raise ValueError(f"Account {account_id} not found")

        # Auto-categorize transactions without categories
        if self.categorization_service:
            for transaction in transactions:
                if not transaction.category_id:
                    transaction.category_id = await self.categorization_service.categorize_transaction(
                        description=transaction.description,
                        amount=float(transaction.amount),
                        merchant_name=transaction.merchant_name,
                    )

        # Bulk create transactions
        imported = await self.transaction_repo.bulk_create(transactions)

        # Update account balance
        total_amount = sum(t.amount for t in imported)
        new_balance = account.balance + total_amount
        await self.account_repo.update_balance(account_id, user_id, new_balance)

        return imported
