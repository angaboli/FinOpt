"""Repository interfaces (Ports) - Define contracts for data access."""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import date, datetime
from decimal import Decimal

from .entities import (
    User,
    Account,
    Category,
    Transaction,
    Budget,
    BudgetEvent,
    Notification,
    NotificationPreferences,
    Goal,
    InsightRecord,
    ImportHistory,
)


class UserRepository(ABC):
    """User repository interface."""

    @abstractmethod
    async def create(self, user: User) -> User:
        """Create a new user."""
        pass

    @abstractmethod
    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        pass

    @abstractmethod
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        pass

    @abstractmethod
    async def update(self, user: User) -> User:
        """Update user."""
        pass


class AccountRepository(ABC):
    """Account repository interface."""

    @abstractmethod
    async def create(self, account: Account) -> Account:
        """Create a new account."""
        pass

    @abstractmethod
    async def get_by_id(self, account_id: str, user_id: str) -> Optional[Account]:
        """Get account by ID."""
        pass

    @abstractmethod
    async def list_by_user(self, user_id: str, is_active: Optional[bool] = None) -> List[Account]:
        """List all accounts for a user."""
        pass

    @abstractmethod
    async def update(self, account: Account) -> Account:
        """Update account."""
        pass

    @abstractmethod
    async def delete(self, account_id: str, user_id: str) -> bool:
        """Delete account."""
        pass

    @abstractmethod
    async def update_balance(self, account_id: str, user_id: str, new_balance: Decimal) -> Account:
        """Update account balance."""
        pass


class CategoryRepository(ABC):
    """Category repository interface."""

    @abstractmethod
    async def create(self, category: Category) -> Category:
        """Create a new category."""
        pass

    @abstractmethod
    async def get_by_id(self, category_id: str) -> Optional[Category]:
        """Get category by ID."""
        pass

    @abstractmethod
    async def list_all(self, user_id: Optional[str] = None) -> List[Category]:
        """List all categories (system + user's custom)."""
        pass

    @abstractmethod
    async def update(self, category: Category) -> Category:
        """Update category."""
        pass

    @abstractmethod
    async def delete(self, category_id: str, user_id: str) -> bool:
        """Delete category."""
        pass


class TransactionRepository(ABC):
    """Transaction repository interface."""

    @abstractmethod
    async def create(self, transaction: Transaction) -> Transaction:
        """Create a new transaction."""
        pass

    @abstractmethod
    async def get_by_id(self, transaction_id: str, user_id: str) -> Optional[Transaction]:
        """Get transaction by ID."""
        pass

    @abstractmethod
    async def list_by_user(
        self,
        user_id: str,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[List[Transaction], int]:
        """
        List transactions for a user with filters.
        Returns (transactions, total_count).
        """
        pass

    @abstractmethod
    async def list_by_account(
        self,
        account_id: str,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Transaction]:
        """List transactions for an account."""
        pass

    @abstractmethod
    async def list_by_category(
        self,
        category_id: str,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Transaction]:
        """List transactions for a category."""
        pass

    @abstractmethod
    async def update(self, transaction: Transaction) -> Transaction:
        """Update transaction."""
        pass

    @abstractmethod
    async def soft_delete(self, transaction_id: str, user_id: str) -> bool:
        """Soft delete transaction."""
        pass

    @abstractmethod
    async def bulk_create(self, transactions: List[Transaction]) -> List[Transaction]:
        """Bulk create transactions."""
        pass

    @abstractmethod
    async def get_spending_by_category(
        self,
        user_id: str,
        start_date: date,
        end_date: date,
    ) -> Dict[str, Decimal]:
        """Get spending aggregated by category."""
        pass


class BudgetRepository(ABC):
    """Budget repository interface."""

    @abstractmethod
    async def create(self, budget: Budget) -> Budget:
        """Create a new budget."""
        pass

    @abstractmethod
    async def get_by_id(self, budget_id: str, user_id: str) -> Optional[Budget]:
        """Get budget by ID."""
        pass

    @abstractmethod
    async def list_by_user(
        self,
        user_id: str,
        is_active: Optional[bool] = None,
        category_id: Optional[str] = None,
    ) -> List[Budget]:
        """List budgets for a user."""
        pass

    @abstractmethod
    async def get_by_category_and_period(
        self,
        user_id: str,
        category_id: str,
        period_start: date,
        period_end: date,
    ) -> Optional[Budget]:
        """Get budget for a specific category and period."""
        pass

    @abstractmethod
    async def update(self, budget: Budget) -> Budget:
        """Update budget."""
        pass

    @abstractmethod
    async def delete(self, budget_id: str, user_id: str) -> bool:
        """Delete budget."""
        pass

    @abstractmethod
    async def get_consumption(self, budget_id: str, user_id: str) -> Dict[str, Any]:
        """Get budget consumption (spent amount and percentage)."""
        pass


class BudgetEventRepository(ABC):
    """Budget event repository interface."""

    @abstractmethod
    async def create(self, event: BudgetEvent) -> BudgetEvent:
        """Create a budget event."""
        pass

    @abstractmethod
    async def list_by_budget(self, budget_id: str, user_id: str) -> List[BudgetEvent]:
        """List events for a budget."""
        pass

    @abstractmethod
    async def list_by_user(self, user_id: str, limit: int = 50) -> List[BudgetEvent]:
        """List recent events for a user."""
        pass


class NotificationRepository(ABC):
    """Notification repository interface."""

    @abstractmethod
    async def create(self, notification: Notification) -> Notification:
        """Create a notification."""
        pass

    @abstractmethod
    async def get_by_id(self, notification_id: str, user_id: str) -> Optional[Notification]:
        """Get notification by ID."""
        pass

    @abstractmethod
    async def list_by_user(
        self,
        user_id: str,
        is_read: Optional[bool] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[List[Notification], int]:
        """List notifications for a user."""
        pass

    @abstractmethod
    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        """Mark notification as read."""
        pass

    @abstractmethod
    async def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user."""
        pass

    @abstractmethod
    async def delete_old(self, days: int = 30) -> int:
        """Delete old notifications."""
        pass


class NotificationPreferencesRepository(ABC):
    """Notification preferences repository interface."""

    @abstractmethod
    async def get_by_user(self, user_id: str) -> Optional[NotificationPreferences]:
        """Get preferences for a user."""
        pass

    @abstractmethod
    async def create_or_update(self, preferences: NotificationPreferences) -> NotificationPreferences:
        """Create or update preferences."""
        pass


class GoalRepository(ABC):
    """Goal repository interface."""

    @abstractmethod
    async def create(self, goal: Goal) -> Goal:
        """Create a new goal."""
        pass

    @abstractmethod
    async def get_by_id(self, goal_id: str, user_id: str) -> Optional[Goal]:
        """Get goal by ID."""
        pass

    @abstractmethod
    async def list_by_user(
        self,
        user_id: str,
        status: Optional[str] = None,
    ) -> List[Goal]:
        """List goals for a user."""
        pass

    @abstractmethod
    async def update(self, goal: Goal) -> Goal:
        """Update goal."""
        pass

    @abstractmethod
    async def delete(self, goal_id: str, user_id: str) -> bool:
        """Delete goal."""
        pass


class InsightRepository(ABC):
    """Insight repository interface."""

    @abstractmethod
    async def create(self, insight: InsightRecord) -> InsightRecord:
        """Create an insight record."""
        pass

    @abstractmethod
    async def get_by_month(self, user_id: str, month_year: str) -> Optional[InsightRecord]:
        """Get insight for a specific month."""
        pass

    @abstractmethod
    async def list_by_user(self, user_id: str, limit: int = 12) -> List[InsightRecord]:
        """List insights for a user."""
        pass


class ImportHistoryRepository(ABC):
    """Import history repository interface."""

    @abstractmethod
    async def create(self, history: ImportHistory) -> ImportHistory:
        """Create import history record."""
        pass

    @abstractmethod
    async def get_by_id(self, history_id: str, user_id: str) -> Optional[ImportHistory]:
        """Get import history by ID."""
        pass

    @abstractmethod
    async def list_by_user(self, user_id: str, limit: int = 50) -> List[ImportHistory]:
        """List import history for a user."""
        pass

    @abstractmethod
    async def update(self, history: ImportHistory) -> ImportHistory:
        """Update import history."""
        pass
