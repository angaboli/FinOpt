from __future__ import annotations

from datetime import date as DateType
from typing import Protocol

from src.domain.entities.account import Account
from src.domain.entities.bank_import import BankImport
from src.domain.entities.budget import Budget
from src.domain.entities.category import Category
from src.domain.entities.income_source import IncomeSource
from src.domain.entities.receipt import Receipt
from src.domain.entities.refresh_token import RefreshToken
from src.domain.entities.savings_goal import SavingsGoal
from src.domain.entities.transaction import Transaction
from src.domain.entities.user import User
from src.domain.value_objects import (
    AccountId,
    BankImportId,
    BudgetId,
    CategoryId,
    Email,
    IncomeSourceId,
    ReceiptId,
    RefreshTokenId,
    SavingsGoalId,
    TransactionId,
    UserId,
)


class UserRepository(Protocol):
    async def get_by_email(self, email: Email) -> User | None: ...

    async def get_by_id(self, user_id: UserId) -> User | None: ...

    async def save(self, user: User) -> None: ...


class RefreshTokenRepository(Protocol):
    async def save(self, refresh_token: RefreshToken) -> None: ...

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None: ...

    async def revoke(self, token_id: RefreshTokenId) -> None: ...


class AccountRepository(Protocol):
    async def save(self, account: Account) -> None: ...

    async def list_by_user(self, user_id: UserId) -> list[Account]: ...

    async def get_by_id_for_user(
        self,
        account_id: AccountId,
        user_id: UserId,
    ) -> Account | None: ...

    async def delete(self, account_id: AccountId, user_id: UserId) -> None: ...


class IncomeSourceRepository(Protocol):
    async def save(self, source: IncomeSource) -> None: ...

    async def list_by_user(self, user_id: UserId) -> list[IncomeSource]: ...

    async def get_by_id_for_user(
        self, source_id: IncomeSourceId, user_id: UserId
    ) -> IncomeSource | None: ...

    async def delete(self, source_id: IncomeSourceId, user_id: UserId) -> None: ...


class CategoryRepository(Protocol):
    async def save(self, category: Category) -> None: ...

    async def save_many(self, categories: list[Category]) -> None: ...

    async def list_by_user(self, user_id: UserId) -> list[Category]: ...

    async def get_by_id_for_user(
        self, category_id: CategoryId, user_id: UserId
    ) -> Category | None: ...

    async def delete(self, category_id: CategoryId, user_id: UserId) -> None: ...


class TransactionRepository(Protocol):
    async def save(self, transaction: Transaction) -> None: ...

    async def list_by_user(
        self,
        user_id: UserId,
        account_id: AccountId | None,
        category_id: CategoryId | None,
        from_date: DateType | None,
        to_date: DateType | None,
        limit: int,
        offset: int,
    ) -> list[Transaction]: ...

    async def get_by_id_for_user(
        self, transaction_id: TransactionId, user_id: UserId
    ) -> Transaction | None: ...

    async def delete(self, transaction_id: TransactionId, user_id: UserId) -> None: ...


class BankImportRepository(Protocol):
    async def save(self, bank_import: BankImport) -> None: ...

    async def list_by_user(self, user_id: UserId) -> list[BankImport]: ...


class BudgetRepository(Protocol):
    async def get_by_month(self, user_id: UserId, year: int, month: int) -> Budget | None: ...

    async def save(self, budget: Budget) -> None: ...


class ReceiptRepository(Protocol):
    async def save(self, receipt: Receipt) -> None: ...

    async def list_by_user(self, user_id: UserId) -> list[Receipt]: ...

    async def get_by_id_for_user(
        self, receipt_id: ReceiptId, user_id: UserId
    ) -> Receipt | None: ...


class SavingsGoalRepository(Protocol):
    async def save(self, goal: SavingsGoal) -> None: ...

    async def list_by_user(self, user_id: UserId) -> list[SavingsGoal]: ...

    async def get_by_id_for_user(
        self, goal_id: SavingsGoalId, user_id: UserId
    ) -> SavingsGoal | None: ...

    async def delete(self, goal_id: SavingsGoalId, user_id: UserId) -> None: ...
