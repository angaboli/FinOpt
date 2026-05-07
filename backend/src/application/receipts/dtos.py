from __future__ import annotations

from dataclasses import dataclass
from datetime import date as DateType
from datetime import datetime
from decimal import Decimal


@dataclass(frozen=True)
class ReceiptItemDto:
    name: str
    amount: Decimal


@dataclass(frozen=True)
class ScanReceiptCommand:
    user_id: str
    image_base64: str
    media_type: str = "image/jpeg"


@dataclass(frozen=True)
class ScanReceiptResult:
    merchant: str | None
    total: Decimal | None
    date: DateType | None
    items: list[ReceiptItemDto]


@dataclass(frozen=True)
class SaveReceiptCommand:
    user_id: str
    merchant: str | None
    total: Decimal | None
    date: DateType | None
    items: list[ReceiptItemDto]
    transaction_id: str | None = None


@dataclass(frozen=True)
class ListReceiptsQuery:
    user_id: str


@dataclass(frozen=True)
class ReceiptItemResult:
    name: str
    amount: Decimal


@dataclass(frozen=True)
class ReceiptResult:
    id: str
    user_id: str
    merchant: str | None
    total: Decimal | None
    date: DateType | None
    items: list[ReceiptItemResult]
    transaction_id: str | None
    created_at: datetime
