from datetime import date as DateType
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field

from src.domain.entities.account import AccountType
from src.domain.entities.income_source import Frequency
from src.domain.entities.transaction import TransactionType


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(default="", max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class LogoutRequest(BaseModel):
    refresh_token: str = Field(min_length=1)


class UserResponse(BaseModel):
    id: str
    email: str
    name: str = ""


class AuthTokensResponse(BaseModel):
    user: UserResponse
    access_token: str
    refresh_token: str
    token_type: str


class AccountRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    account_type: AccountType
    balance: Decimal
    currency: str = Field(min_length=3, max_length=3)
    color: str = Field(min_length=1, max_length=32)


class AccountResponse(BaseModel):
    id: str
    user_id: str
    name: str
    account_type: str
    balance: Decimal
    currency: str
    color: str


class IncomeSourceRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    amount: Decimal = Field(ge=0)
    frequency: Frequency


class IncomeSourceResponse(BaseModel):
    id: str
    user_id: str
    name: str
    amount: Decimal
    frequency: str


class CategoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color: str = Field(min_length=1, max_length=32)


class CategoryResponse(BaseModel):
    id: str
    user_id: str
    name: str
    color: str


class TransactionRequest(BaseModel):
    account_id: str
    category_id: str
    title: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=0)
    transaction_type: TransactionType
    date: DateType
    note: str | None = None


class TransactionUpdateRequest(BaseModel):
    category_id: str
    title: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=0)
    transaction_type: TransactionType
    date: DateType
    note: str | None = None


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    account_id: str
    category_id: str
    title: str
    amount: Decimal
    transaction_type: str
    date: DateType
    note: str | None


class ImportRowRequest(BaseModel):
    date: DateType
    title: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(gt=0)
    transaction_type: str = Field(pattern="^(INCOME|EXPENSE)$")
    category_id: str


class ImportBankStatementRequest(BaseModel):
    account_id: str
    source_name: str = Field(default="Import", max_length=200)
    rows: list[ImportRowRequest] = Field(min_length=1)


class BankImportResponse(BaseModel):
    id: str
    user_id: str
    account_id: str
    source_name: str
    row_count: int
    imported_count: int
    created_at: datetime


class ParsePdfRequest(BaseModel):
    file_base64: str
    source_name: str = Field(default="PDF Import", max_length=200)


class ParsedPdfRowResponse(BaseModel):
    date: DateType
    title: str
    amount: Decimal
    transaction_type: str


class BudgetLineRequest(BaseModel):
    category_id: str
    planned_amount: Decimal = Field(ge=0)


class BudgetRequest(BaseModel):
    year: int = Field(ge=2000)
    month: int = Field(ge=1, le=12)
    lines: list[BudgetLineRequest]


class BudgetLineResponse(BaseModel):
    category_id: str
    planned_amount: Decimal


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    year: int
    month: int
    lines: list[BudgetLineResponse]
    total_planned: Decimal


class ReceiptItemRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    amount: Decimal = Field(ge=0)
    category_id: str | None = None


class ScanReceiptRequest(BaseModel):
    image_base64: str = Field(min_length=1)
    media_type: str = Field(default="image/jpeg")


class ScanReceiptResponse(BaseModel):
    merchant: str | None
    total: Decimal | None
    date: DateType | None
    items: list[ReceiptItemRequest]


class SaveReceiptRequest(BaseModel):
    merchant: str | None = None
    total: Decimal | None = None
    date: DateType | None = None
    items: list[ReceiptItemRequest] = Field(default_factory=list)
    transaction_id: str | None = None


class ReceiptItemResponse(BaseModel):
    name: str
    amount: Decimal
    category_id: str | None = None


class ReceiptResponse(BaseModel):
    id: str
    user_id: str
    merchant: str | None
    total: Decimal | None
    date: DateType | None
    items: list[ReceiptItemResponse]
    transaction_id: str | None
    created_at: datetime


class SavingsGoalRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    target_amount: Decimal = Field(gt=0)
    current_amount: Decimal = Field(ge=0)
    deadline: DateType | None = None


class SavingsGoalResponse(BaseModel):
    id: str
    user_id: str
    name: str
    target_amount: Decimal
    current_amount: Decimal
    deadline: DateType | None
    progress_ratio: float
    remaining_amount: Decimal
    created_at: datetime


class BudgetAdviceRequest(BaseModel):
    year: int = Field(ge=2000)
    month: int = Field(ge=1, le=12)


class BudgetAdviceResponse(BaseModel):
    summary: str
    tips: list[str]
    savings_advice: str | None
    period_label: str
    sentiment: str
