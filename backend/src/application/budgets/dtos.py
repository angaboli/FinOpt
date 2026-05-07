from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class BudgetLineCommand:
    category_id: str
    planned_amount: Decimal


@dataclass(frozen=True)
class SetBudgetCommand:
    user_id: str
    year: int
    month: int
    lines: list[BudgetLineCommand]


@dataclass(frozen=True)
class GetBudgetQuery:
    user_id: str
    year: int
    month: int


@dataclass(frozen=True)
class BudgetLineResult:
    category_id: str
    planned_amount: Decimal


@dataclass(frozen=True)
class BudgetResult:
    id: str
    user_id: str
    year: int
    month: int
    lines: list[BudgetLineResult]
    total_planned: Decimal
