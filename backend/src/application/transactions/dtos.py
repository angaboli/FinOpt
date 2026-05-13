from dataclasses import dataclass, field
from datetime import date as DateType
from decimal import Decimal


@dataclass(frozen=True)
class CreateTransactionCommand:
    user_id: str
    account_id: str
    category_id: str
    title: str
    amount: Decimal
    transaction_type: str
    date: DateType
    note: str | None
    is_subscription: bool = False


@dataclass(frozen=True)
class UpdateTransactionCommand:
    user_id: str
    transaction_id: str
    category_id: str
    title: str
    amount: Decimal
    transaction_type: str
    date: DateType
    note: str | None
    is_subscription: bool = False


@dataclass(frozen=True)
class ListTransactionsQuery:
    user_id: str
    account_id: str | None = None
    category_id: str | None = None
    from_date: DateType | None = None
    to_date: DateType | None = None
    limit: int = 50
    offset: int = 0


@dataclass(frozen=True)
class DeleteTransactionCommand:
    user_id: str
    transaction_id: str


@dataclass(frozen=True)
class TransactionResult:
    id: str
    user_id: str
    account_id: str
    category_id: str
    title: str
    amount: Decimal
    transaction_type: str
    date: DateType
    note: str | None
    is_subscription: bool = False


@dataclass(frozen=True)
class TransferCommand:
    user_id: str
    from_account_id: str
    to_account_id: str
    category_id: str
    amount: Decimal
    date: DateType
    note: str | None


@dataclass(frozen=True)
class TransferResult:
    debit_transaction_id: str
    credit_transaction_id: str
