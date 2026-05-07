from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GenerateBudgetAdviceCommand:
    user_id: str
    year: int
    month: int


@dataclass(frozen=True)
class BudgetAdviceResult:
    summary: str
    tips: list[str]
    savings_advice: str | None
    period_label: str
