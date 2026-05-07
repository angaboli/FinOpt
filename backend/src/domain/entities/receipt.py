from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date as DateType
from datetime import datetime
from decimal import Decimal

from src.domain.value_objects import ReceiptId, UserId


@dataclass(frozen=True)
class ReceiptItem:
    name: str
    amount: Decimal
    category_id: str | None = None


@dataclass
class Receipt:
    id: ReceiptId
    user_id: UserId
    merchant: str | None
    total: Decimal | None
    date: DateType | None
    items: list[ReceiptItem]
    transaction_id: str | None
    created_at: datetime

    @classmethod
    def create(
        cls,
        user_id: UserId,
        merchant: str | None,
        total: Decimal | None,
        date: DateType | None,
        items: list[ReceiptItem],
        transaction_id: str | None = None,
    ) -> Receipt:
        from datetime import UTC
        return cls(
            id=ReceiptId.new(),
            user_id=user_id,
            merchant=merchant,
            total=total,
            date=date,
            items=items,
            transaction_id=transaction_id,
            created_at=datetime.now(UTC),
        )
