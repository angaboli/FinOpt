from __future__ import annotations

from dataclasses import dataclass
from datetime import date as DateType
from datetime import datetime
from decimal import Decimal


@dataclass(frozen=True)
class ImportRowCommand:
    date: DateType
    title: str
    amount: Decimal
    transaction_type: str  # "INCOME" | "EXPENSE"
    category_id: str


@dataclass(frozen=True)
class ImportBankStatementCommand:
    user_id: str
    account_id: str
    source_name: str
    rows: list[ImportRowCommand]


@dataclass(frozen=True)
class ListBankImportsQuery:
    user_id: str


@dataclass(frozen=True)
class ParsePdfCommand:
    user_id: str
    file_base64: str
    source_name: str = "PDF Import"


@dataclass(frozen=True)
class ParsedPdfRowResult:
    date: DateType
    title: str
    amount: Decimal
    transaction_type: str  # "INCOME" | "EXPENSE"


@dataclass(frozen=True)
class BankImportResult:
    id: str
    user_id: str
    account_id: str
    source_name: str
    row_count: int
    imported_count: int
    created_at: datetime
