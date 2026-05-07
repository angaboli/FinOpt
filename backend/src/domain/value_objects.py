from __future__ import annotations

import re
from dataclasses import dataclass
from uuid import UUID, uuid4

from src.domain.exceptions import InvalidEmailError

EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


@dataclass(frozen=True)
class Email:
    value: str

    def __post_init__(self) -> None:
        normalized = self.value.strip().lower()
        if not EMAIL_PATTERN.match(normalized):
            raise InvalidEmailError(self.value)
        object.__setattr__(self, "value", normalized)


@dataclass(frozen=True)
class UserId:
    value: UUID

    @classmethod
    def new(cls) -> UserId:
        return cls(uuid4())

    @classmethod
    def from_string(cls, value: str) -> UserId:
        return cls(UUID(value))


@dataclass(frozen=True)
class RefreshTokenId:
    value: UUID

    @classmethod
    def new(cls) -> RefreshTokenId:
        return cls(uuid4())


@dataclass(frozen=True)
class AccountId:
    value: UUID

    @classmethod
    def new(cls) -> AccountId:
        return cls(uuid4())

    @classmethod
    def from_string(cls, value: str) -> AccountId:
        return cls(UUID(value))


@dataclass(frozen=True)
class IncomeSourceId:
    value: UUID

    @classmethod
    def new(cls) -> IncomeSourceId:
        return cls(uuid4())

    @classmethod
    def from_string(cls, value: str) -> IncomeSourceId:
        return cls(UUID(value))


@dataclass(frozen=True)
class CategoryId:
    value: UUID

    @classmethod
    def new(cls) -> CategoryId:
        return cls(uuid4())

    @classmethod
    def from_string(cls, value: str) -> CategoryId:
        return cls(UUID(value))


@dataclass(frozen=True)
class TransactionId:
    value: UUID

    @classmethod
    def new(cls) -> TransactionId:
        return cls(uuid4())

    @classmethod
    def from_string(cls, value: str) -> TransactionId:
        return cls(UUID(value))


@dataclass(frozen=True)
class ReceiptId:
    value: UUID

    @classmethod
    def new(cls) -> ReceiptId:
        return cls(uuid4())

    @classmethod
    def from_string(cls, value: str) -> ReceiptId:
        return cls(UUID(value))


@dataclass(frozen=True)
class BankImportId:
    value: UUID

    @classmethod
    def new(cls) -> BankImportId:
        return cls(uuid4())

    @classmethod
    def from_string(cls, value: str) -> BankImportId:
        return cls(UUID(value))


@dataclass(frozen=True)
class BudgetId:
    value: UUID

    @classmethod
    def new(cls) -> BudgetId:
        return cls(uuid4())

    @classmethod
    def from_string(cls, value: str) -> BudgetId:
        return cls(UUID(value))


@dataclass(frozen=True)
class SavingsGoalId:
    value: UUID

    @classmethod
    def new(cls) -> SavingsGoalId:
        return cls(uuid4())

    @classmethod
    def from_string(cls, value: str) -> SavingsGoalId:
        return cls(UUID(value))
