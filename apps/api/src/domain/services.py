"""Service interfaces (Ports) - Define contracts for external services."""

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import date
from .entities import Transaction, Account, Budget


class LLMClientPort(ABC):
    """LLM client interface for AI insights."""

    @abstractmethod
    async def generate_insights(
        self,
        transactions: List[Transaction],
        accounts: List[Account],
        budgets: List[Budget],
        month_year: str,
        income_estimate: float,
        fixed_costs_estimate: float,
    ) -> Dict[str, Any]:
        """
        Generate financial insights from transaction data.

        Returns a structured JSON with:
        - savings_opportunities
        - saving_strategies
        - subscriptions
        - anomalies
        - budget_adjustments
        - avoid_spending_triggers
        - next_actions
        """
        pass


class PushNotificationPort(ABC):
    """Push notification service interface."""

    @abstractmethod
    async def send_notification(
        self,
        push_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Send push notification to a device."""
        pass

    @abstractmethod
    async def send_batch_notifications(
        self,
        notifications: List[Dict[str, Any]],
    ) -> List[bool]:
        """Send batch push notifications."""
        pass


class StatementParserPort(ABC):
    """Statement parser interface for importing transactions."""

    @abstractmethod
    async def parse_csv(
        self,
        file_content: bytes,
        account_id: str,
        user_id: str,
    ) -> List[Transaction]:
        """Parse CSV file and return transactions."""
        pass

    @abstractmethod
    async def parse_ofx(
        self,
        file_content: bytes,
        account_id: str,
        user_id: str,
    ) -> List[Transaction]:
        """Parse OFX file and return transactions."""
        pass

    @abstractmethod
    async def parse_pdf(
        self,
        file_content: bytes,
        account_id: str,
        user_id: str,
    ) -> List[Transaction]:
        """Parse PDF file and return transactions."""
        pass


class CategorizationPort(ABC):
    """Transaction categorization service interface."""

    @abstractmethod
    async def categorize_transaction(
        self,
        description: str,
        amount: float,
        merchant_name: Optional[str] = None,
    ) -> Optional[str]:
        """
        Automatically categorize a transaction based on description and merchant.
        Returns category_id or None.
        """
        pass

    @abstractmethod
    async def detect_recurring_transactions(
        self,
        transactions: List[Transaction],
    ) -> List[str]:
        """
        Detect recurring transactions from a list.
        Returns list of transaction IDs that are recurring.
        """
        pass


class EmailServicePort(ABC):
    """Email service interface (for future use)."""

    @abstractmethod
    async def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
    ) -> bool:
        """Send email."""
        pass


class CachePort(ABC):
    """Cache service interface."""

    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        pass

    @abstractmethod
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache with optional TTL in seconds."""
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        pass

    @abstractmethod
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern."""
        pass
