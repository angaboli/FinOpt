"""Account use cases - Application business logic."""

from typing import List, Optional, Any
from datetime import datetime
from decimal import Decimal
import uuid

from src.domain.entities import Account, AccountType, OwnerScope
from src.domain.repositories import AccountRepository


class CreateAccountUseCase:
    """Use case for creating an account."""

    def __init__(self, account_repo: AccountRepository):
        self.account_repo = account_repo

    async def execute(
        self,
        user_id: str,
        name: str,
        type: AccountType,
        owner_scope: OwnerScope,
        currency: str = "EUR",
        bank_name: Optional[str] = None,
        iban_last4: Optional[str] = None,
    ) -> Account:
        """Create a new account."""

        account = Account(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=name,
            type=type,
            owner_scope=owner_scope,
            currency=currency,
            balance=Decimal("0"),
            bank_name=bank_name,
            iban_last4=iban_last4,
        )

        return await self.account_repo.create(account)


class UpdateAccountUseCase:
    """Use case for updating an account."""

    def __init__(self, account_repo: AccountRepository):
        self.account_repo = account_repo

    async def execute(self, account_id: str, user_id: str, **updates: Any) -> Account:
        """Update an account."""

        account = await self.account_repo.get_by_id(account_id, user_id)
        if not account:
            raise ValueError(f"Account {account_id} not found")

        for key, value in updates.items():
            if hasattr(account, key) and value is not None:
                setattr(account, key, value)

        account.updated_at = datetime.utcnow()

        return await self.account_repo.update(account)


class DeleteAccountUseCase:
    """Use case for deleting an account."""

    def __init__(self, account_repo: AccountRepository):
        self.account_repo = account_repo

    async def execute(self, account_id: str, user_id: str) -> bool:
        """Delete an account."""
        return await self.account_repo.delete(account_id, user_id)


class ListAccountsUseCase:
    """Use case for listing accounts."""

    def __init__(self, account_repo: AccountRepository):
        self.account_repo = account_repo

    async def execute(self, user_id: str, is_active: Optional[bool] = None) -> List[Account]:
        """List accounts for a user."""
        return await self.account_repo.list_by_user(user_id, is_active)


class GetAccountUseCase:
    """Use case for getting a single account."""

    def __init__(self, account_repo: AccountRepository):
        self.account_repo = account_repo

    async def execute(self, account_id: str, user_id: str) -> Optional[Account]:
        """Get an account by ID."""
        return await self.account_repo.get_by_id(account_id, user_id)
