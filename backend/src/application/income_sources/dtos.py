from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class CreateIncomeSourceCommand:
    user_id: str
    name: str
    amount: Decimal
    frequency: str


@dataclass(frozen=True)
class UpdateIncomeSourceCommand:
    user_id: str
    source_id: str
    name: str
    amount: Decimal
    frequency: str


@dataclass(frozen=True)
class ListIncomeSourcesQuery:
    user_id: str


@dataclass(frozen=True)
class DeleteIncomeSourceCommand:
    user_id: str
    source_id: str


@dataclass(frozen=True)
class IncomeSourceResult:
    id: str
    user_id: str
    name: str
    amount: Decimal
    frequency: str
