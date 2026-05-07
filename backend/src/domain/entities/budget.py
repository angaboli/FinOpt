from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal

from src.domain.exceptions import InvalidBudgetError
from src.domain.value_objects import BudgetId, CategoryId, UserId


@dataclass(frozen=True)
class BudgetLine:
    category_id: CategoryId
    planned_amount: Decimal

    def __post_init__(self) -> None:
        if self.planned_amount < Decimal("0"):
            raise InvalidBudgetError("Planned amount must be non-negative")


@dataclass
class Budget:
    id: BudgetId
    user_id: UserId
    year: int
    month: int
    lines: list[BudgetLine]

    def __post_init__(self) -> None:
        if not (1 <= self.month <= 12):
            raise InvalidBudgetError(f"Invalid month: {self.month}")
        if self.year < 2000:
            raise InvalidBudgetError(f"Invalid year: {self.year}")

    @classmethod
    def create(
        cls,
        user_id: UserId,
        year: int,
        month: int,
        lines: list[BudgetLine],
    ) -> Budget:
        return cls(id=BudgetId.new(), user_id=user_id, year=year, month=month, lines=lines)

    def update(self, lines: list[BudgetLine]) -> None:
        self.lines = lines

    @property
    def total_planned(self) -> Decimal:
        return sum((line.planned_amount for line in self.lines), Decimal("0"))
