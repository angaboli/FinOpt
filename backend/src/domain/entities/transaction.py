from __future__ import annotations

from dataclasses import dataclass
from datetime import date as DateType
from decimal import Decimal
from enum import StrEnum

from src.domain.exceptions import InvalidTransactionError
from src.domain.value_objects import AccountId, CategoryId, TransactionId, UserId


class TransactionType(StrEnum):
    INCOME = "INCOME"
    EXPENSE = "EXPENSE"


@dataclass
class Transaction:
    id: TransactionId
    user_id: UserId
    account_id: AccountId
    category_id: CategoryId
    title: str
    amount: Decimal
    transaction_type: TransactionType
    date: DateType
    note: str | None

    @classmethod
    def create(
        cls,
        user_id: UserId,
        account_id: AccountId,
        category_id: CategoryId,
        title: str,
        amount: Decimal,
        transaction_type: TransactionType,
        date: DateType,
        note: str | None,
    ) -> Transaction:
        return cls(
            id=TransactionId.new(),
            user_id=user_id,
            account_id=account_id,
            category_id=category_id,
            title=title,
            amount=amount,
            transaction_type=transaction_type,
            date=date,
            note=note,
        )

    def __post_init__(self) -> None:
        normalized_title = self.title.strip()
        if not normalized_title:
            raise InvalidTransactionError("Transaction title is required")
        if self.amount <= Decimal("0"):
            raise InvalidTransactionError("Amount must be positive")
        object.__setattr__(self, "title", normalized_title)

    def update(
        self,
        category_id: CategoryId,
        title: str,
        amount: Decimal,
        transaction_type: TransactionType,
        date: DateType,
        note: str | None,
    ) -> None:
        self.category_id = category_id
        self.title = title
        self.amount = amount
        self.transaction_type = transaction_type
        self.date = date
        self.note = note
        self.__post_init__()

    @property
    def balance_delta(self) -> Decimal:
        return self.amount if self.transaction_type == TransactionType.INCOME else -self.amount
