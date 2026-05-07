from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from enum import StrEnum

from src.domain.exceptions import InvalidIncomeSourceError
from src.domain.value_objects import IncomeSourceId, UserId


class Frequency(StrEnum):
    MONTHLY = "MONTHLY"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    QUARTERLY = "QUARTERLY"
    ANNUAL = "ANNUAL"
    ONCE = "ONCE"


@dataclass
class IncomeSource:
    id: IncomeSourceId
    user_id: UserId
    name: str
    amount: Decimal
    frequency: Frequency

    @classmethod
    def create(
        cls,
        user_id: UserId,
        name: str,
        amount: Decimal,
        frequency: Frequency,
    ) -> IncomeSource:
        return cls(
            id=IncomeSourceId.new(),
            user_id=user_id,
            name=name,
            amount=amount,
            frequency=frequency,
        )

    def __post_init__(self) -> None:
        normalized_name = self.name.strip()
        if not normalized_name:
            raise InvalidIncomeSourceError("Income source name is required")
        if self.amount < Decimal("0"):
            raise InvalidIncomeSourceError("Amount must be non-negative")
        object.__setattr__(self, "name", normalized_name)

    def update(self, name: str, amount: Decimal, frequency: Frequency) -> None:
        self.name = name
        self.amount = amount
        self.frequency = frequency
        self.__post_init__()
