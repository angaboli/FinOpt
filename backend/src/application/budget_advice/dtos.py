from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class GenerateBudgetAdviceCommand:
    user_id: str
    year: int
    month: int


@dataclass(frozen=True)
class MerchantPlanItem:
    merchant: str
    items: list[str]
    reason: str


@dataclass(frozen=True)
class BudgetAdviceResult:
    summary: str
    tips: list[str]
    savings_advice: str | None
    period_label: str
    sentiment: str  # "positive" | "neutral" | "negative"
    cut_suggestions: list[str] = field(default_factory=list)
    merchant_plan: list[MerchantPlanItem] = field(default_factory=list)
