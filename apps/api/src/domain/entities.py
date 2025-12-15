"""Domain entities - Business objects with behavior."""

from dataclasses import dataclass, field
from datetime import datetime, date
from decimal import Decimal
from typing import Optional, List, Dict, Any
from enum import Enum


class AccountType(str, Enum):
    """Account type enumeration."""
    CHECKING = "CHECKING"
    SAVINGS = "SAVINGS"
    CREDIT_CARD = "CREDIT_CARD"
    BUSINESS = "BUSINESS"
    CASH = "CASH"
    INVESTMENT = "INVESTMENT"
    LOAN = "LOAN"
    OTHER = "OTHER"


class OwnerScope(str, Enum):
    """Owner scope enumeration."""
    PERSONAL = "PERSONAL"
    PROFESSIONAL = "PROFESSIONAL"


class TransactionStatus(str, Enum):
    """Transaction status enumeration."""
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class NotificationType(str, Enum):
    """Notification type enumeration."""
    BUDGET_WARNING = "BUDGET_WARNING"
    BUDGET_EXCEEDED = "BUDGET_EXCEEDED"
    ANOMALY_DETECTED = "ANOMALY_DETECTED"
    GOAL_MILESTONE = "GOAL_MILESTONE"
    INSIGHT_READY = "INSIGHT_READY"


class GoalStatus(str, Enum):
    """Goal status enumeration."""
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


@dataclass
class User:
    """User entity."""
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Account:
    """Account entity with balance management."""
    id: str
    user_id: str
    name: str
    type: AccountType
    owner_scope: OwnerScope
    currency: str
    balance: Decimal
    bank_name: Optional[str] = None
    iban_last4: Optional[str] = None
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def update_balance(self, amount: Decimal) -> None:
        """Update account balance."""
        self.balance += amount

    def is_savings_account(self) -> bool:
        """Check if this is a savings account."""
        return self.type == AccountType.SAVINGS

    def is_credit_card(self) -> bool:
        """Check if this is a credit card account."""
        return self.type == AccountType.CREDIT_CARD

    def is_professional(self) -> bool:
        """Check if this is a professional account."""
        return self.owner_scope == OwnerScope.PROFESSIONAL


@dataclass
class Category:
    """Category entity."""
    id: str
    name: str
    user_id: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    is_system: bool = False
    parent_category_id: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Transaction:
    """Transaction entity with validation."""
    id: str
    user_id: str
    account_id: str
    amount: Decimal
    currency: str
    date: datetime
    description: str
    category_id: Optional[str] = None
    merchant_name: Optional[str] = None
    is_recurring: bool = False
    is_manual: bool = False
    status: TransactionStatus = TransactionStatus.COMPLETED
    notes: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    deleted_at: Optional[datetime] = None

    def is_expense(self) -> bool:
        """Check if transaction is an expense."""
        return self.amount < 0

    def is_income(self) -> bool:
        """Check if transaction is income."""
        return self.amount > 0

    def soft_delete(self) -> None:
        """Soft delete transaction."""
        self.deleted_at = datetime.utcnow()

    def is_deleted(self) -> bool:
        """Check if transaction is deleted."""
        return self.deleted_at is not None


@dataclass
class Budget:
    """Budget entity with threshold monitoring."""
    id: str
    user_id: str
    category_id: str
    amount: Decimal
    period_start: date
    period_end: date
    warning_threshold: Decimal = Decimal("0.80")
    critical_threshold: Decimal = Decimal("1.00")
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def check_threshold(self, spent: Decimal) -> Optional[str]:
        """
        Check if spending has crossed any threshold.
        Returns threshold type: 'warning', 'critical', or None
        """
        if self.amount == 0:
            return None

        percentage = spent / self.amount

        if percentage >= self.critical_threshold:
            return "critical"
        elif percentage >= self.warning_threshold:
            return "warning"
        return None

    def get_percentage_spent(self, spent: Decimal) -> Decimal:
        """Calculate percentage of budget spent."""
        if self.amount == 0:
            return Decimal("0")
        return (spent / self.amount) * 100


@dataclass
class BudgetEvent:
    """Budget event entity for threshold breaches."""
    id: str
    budget_id: str
    user_id: str
    event_type: str
    threshold_percentage: Decimal
    current_spent: Decimal
    budget_amount: Decimal
    triggered_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Notification:
    """Notification entity."""
    id: str
    user_id: str
    type: NotificationType
    title: str
    body: str
    data: Optional[Dict[str, Any]] = None
    is_read: bool = False
    sent_at: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.utcnow)

    def mark_as_read(self) -> None:
        """Mark notification as read."""
        self.is_read = True

    def mark_as_sent(self) -> None:
        """Mark notification as sent."""
        self.sent_at = datetime.utcnow()


@dataclass
class NotificationPreferences:
    """Notification preferences entity."""
    id: str
    user_id: str
    budget_warnings_enabled: bool = True
    budget_exceeded_enabled: bool = True
    anomaly_alerts_enabled: bool = True
    insights_enabled: bool = True
    warning_threshold: Decimal = Decimal("0.80")
    critical_threshold: Decimal = Decimal("1.00")
    push_token: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Goal:
    """Goal entity with progress tracking."""
    id: str
    user_id: str
    title: str
    target_amount: Decimal
    target_date: date
    description: Optional[str] = None
    current_amount: Decimal = Decimal("0")
    priority: int = 1
    linked_account_id: Optional[str] = None
    status: GoalStatus = GoalStatus.ACTIVE
    plan: Optional[Dict[str, Any]] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def get_progress_percentage(self) -> Decimal:
        """Calculate goal progress percentage."""
        if self.target_amount == 0:
            return Decimal("0")
        return (self.current_amount / self.target_amount) * 100

    def is_completed(self) -> bool:
        """Check if goal is completed."""
        return self.current_amount >= self.target_amount

    def add_progress(self, amount: Decimal) -> None:
        """Add progress to goal."""
        self.current_amount += amount
        if self.is_completed() and self.status == GoalStatus.ACTIVE:
            self.status = GoalStatus.COMPLETED


@dataclass
class InsightRecord:
    """Insight record entity."""
    id: str
    user_id: str
    month_year: str
    data: Dict[str, Any]
    income_estimate: Optional[Decimal] = None
    fixed_costs_estimate: Optional[Decimal] = None
    generated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class ImportHistory:
    """Import history entity."""
    id: str
    user_id: str
    account_id: str
    file_name: str
    file_type: str
    transactions_imported: int = 0
    status: str = "PROCESSING"
    error_message: Optional[str] = None
    imported_at: datetime = field(default_factory=datetime.utcnow)

    def mark_success(self, count: int) -> None:
        """Mark import as successful."""
        self.status = "SUCCESS"
        self.transactions_imported = count

    def mark_failed(self, error: str) -> None:
        """Mark import as failed."""
        self.status = "FAILED"
        self.error_message = error
