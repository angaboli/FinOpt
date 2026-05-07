from __future__ import annotations

from dataclasses import dataclass
from datetime import date as DateType
from datetime import datetime
from decimal import Decimal

from src.domain.value_objects import SavingsGoalId, UserId


@dataclass
class SavingsGoal:
    id: SavingsGoalId
    user_id: UserId
    name: str
    target_amount: Decimal
    current_amount: Decimal
    deadline: DateType | None
    created_at: datetime

    @classmethod
    def create(
        cls,
        user_id: UserId,
        name: str,
        target_amount: Decimal,
        current_amount: Decimal,
        deadline: DateType | None,
    ) -> SavingsGoal:
        from datetime import UTC
        return cls(
            id=SavingsGoalId.new(),
            user_id=user_id,
            name=name,
            target_amount=target_amount,
            current_amount=current_amount,
            deadline=deadline,
            created_at=datetime.now(UTC),
        )

    @property
    def progress_ratio(self) -> float:
        if self.target_amount <= 0:
            return 0.0
        ratio = float(self.current_amount / self.target_amount)
        return min(ratio, 1.0)

    @property
    def remaining_amount(self) -> Decimal:
        return max(self.target_amount - self.current_amount, Decimal("0"))
