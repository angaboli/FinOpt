from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class CreateAccountCommand:
    user_id: str
    name: str
    account_type: str
    balance: Decimal
    currency: str
    color: str


@dataclass(frozen=True)
class UpdateAccountCommand:
    user_id: str
    account_id: str
    name: str
    account_type: str
    balance: Decimal
    currency: str
    color: str


@dataclass(frozen=True)
class ListAccountsQuery:
    user_id: str


@dataclass(frozen=True)
class DeleteAccountCommand:
    user_id: str
    account_id: str


@dataclass(frozen=True)
class AccountResult:
    id: str
    user_id: str
    name: str
    account_type: str
    balance: Decimal
    currency: str
    color: str
