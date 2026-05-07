from __future__ import annotations

from dataclasses import dataclass
from datetime import date as DateType
from datetime import datetime
from decimal import Decimal


@dataclass(frozen=True)
class CreateSavingsGoalCommand:
    user_id: str
    name: str
    target_amount: Decimal
    current_amount: Decimal
    deadline: DateType | None


@dataclass(frozen=True)
class UpdateSavingsGoalCommand:
    user_id: str
    goal_id: str
    name: str
    target_amount: Decimal
    current_amount: Decimal
    deadline: DateType | None


@dataclass(frozen=True)
class DeleteSavingsGoalCommand:
    user_id: str
    goal_id: str


@dataclass(frozen=True)
class ListSavingsGoalsQuery:
    user_id: str


@dataclass(frozen=True)
class SavingsGoalResult:
    id: str
    user_id: str
    name: str
    target_amount: Decimal
    current_amount: Decimal
    deadline: DateType | None
    progress_ratio: float
    remaining_amount: Decimal
    created_at: datetime
