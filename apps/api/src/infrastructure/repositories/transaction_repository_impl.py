"""Transaction repository implementation using Supabase."""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from supabase import Client

from src.domain.entities import Transaction, TransactionStatus
from src.domain.repositories import TransactionRepository


class TransactionRepositoryImpl(TransactionRepository):
    """Transaction repository implementation."""

    def __init__(self, db_client: Client):
        self.db = db_client

    def _to_entity(self, data: Dict[str, Any]) -> Transaction:
        """Convert database row to entity."""
        return Transaction(
            id=data["id"],
            user_id=data["user_id"],
            account_id=data["account_id"],
            amount=Decimal(str(data["amount"])),
            currency=data["currency"],
            date=datetime.fromisoformat(data["date"]),
            description=data["description"],
            category_id=data.get("category_id"),
            merchant_name=data.get("merchant_name"),
            is_recurring=data.get("is_recurring", False),
            is_manual=data.get("is_manual", False),
            status=TransactionStatus(data["status"]),
            notes=data.get("notes"),
            tags=data.get("tags", []),
            metadata=data.get("metadata", {}),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            deleted_at=datetime.fromisoformat(data["deleted_at"]) if data.get("deleted_at") else None,
        )

    def _to_dict(self, transaction: Transaction) -> Dict[str, Any]:
        """Convert entity to database dict."""
        return {
            "id": transaction.id,
            "user_id": transaction.user_id,
            "account_id": transaction.account_id,
            "amount": float(transaction.amount),
            "currency": transaction.currency,
            "date": transaction.date.isoformat(),
            "description": transaction.description,
            "category_id": transaction.category_id,
            "merchant_name": transaction.merchant_name,
            "is_recurring": transaction.is_recurring,
            "is_manual": transaction.is_manual,
            "status": transaction.status.value,
            "notes": transaction.notes,
            "tags": transaction.tags,
            "metadata": transaction.metadata,
            "created_at": transaction.created_at.isoformat(),
            "updated_at": transaction.updated_at.isoformat(),
            "deleted_at": transaction.deleted_at.isoformat() if transaction.deleted_at else None,
        }

    async def create(self, transaction: Transaction) -> Transaction:
        """Create a new transaction."""
        data = self._to_dict(transaction)
        result = self.db.table("transactions").insert(data).execute()
        return self._to_entity(result.data[0])

    async def get_by_id(self, transaction_id: str, user_id: str) -> Optional[Transaction]:
        """Get transaction by ID."""
        result = (
            self.db.table("transactions")
            .select("*")
            .eq("id", transaction_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        return self._to_entity(result.data[0]) if result.data else None

    async def list_by_user(
        self,
        user_id: str,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[List[Transaction], int]:
        """List transactions for a user with filters."""
        query = self.db.table("transactions").select("*", count="exact").eq("user_id", user_id).is_("deleted_at", "null")

        # Apply filters
        if filters:
            if filters.get("account_id"):
                query = query.eq("account_id", filters["account_id"])
            if filters.get("category_id"):
                query = query.eq("category_id", filters["category_id"])
            if filters.get("start_date"):
                query = query.gte("date", filters["start_date"])
            if filters.get("end_date"):
                query = query.lte("date", filters["end_date"])
            if filters.get("min_amount"):
                query = query.gte("amount", filters["min_amount"])
            if filters.get("max_amount"):
                query = query.lte("amount", filters["max_amount"])
            if filters.get("is_manual") is not None:
                query = query.eq("is_manual", filters["is_manual"])
            if filters.get("search"):
                query = query.ilike("description", f"%{filters['search']}%")

        # Pagination
        offset = (page - 1) * limit
        query = query.order("date", desc=True).range(offset, offset + limit - 1)

        result = query.execute()
        transactions = [self._to_entity(row) for row in result.data]
        total = result.count if result.count else 0

        return transactions, total

    async def list_by_account(
        self,
        account_id: str,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Transaction]:
        """List transactions for an account."""
        query = (
            self.db.table("transactions")
            .select("*")
            .eq("account_id", account_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
        )

        if start_date:
            query = query.gte("date", start_date.isoformat())
        if end_date:
            query = query.lte("date", end_date.isoformat())

        result = query.order("date", desc=True).execute()
        return [self._to_entity(row) for row in result.data]

    async def list_by_category(
        self,
        category_id: str,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Transaction]:
        """List transactions for a category."""
        query = (
            self.db.table("transactions")
            .select("*")
            .eq("category_id", category_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
        )

        if start_date:
            query = query.gte("date", start_date.isoformat())
        if end_date:
            query = query.lte("date", end_date.isoformat())

        result = query.order("date", desc=True).execute()
        return [self._to_entity(row) for row in result.data]

    async def update(self, transaction: Transaction) -> Transaction:
        """Update transaction."""
        data = self._to_dict(transaction)
        result = (
            self.db.table("transactions")
            .update(data)
            .eq("id", transaction.id)
            .eq("user_id", transaction.user_id)
            .execute()
        )
        return self._to_entity(result.data[0])

    async def soft_delete(self, transaction_id: str, user_id: str) -> bool:
        """Soft delete transaction."""
        result = (
            self.db.table("transactions")
            .update({"deleted_at": datetime.utcnow().isoformat()})
            .eq("id", transaction_id)
            .eq("user_id", user_id)
            .execute()
        )
        return len(result.data) > 0

    async def bulk_create(self, transactions: List[Transaction]) -> List[Transaction]:
        """Bulk create transactions."""
        data = [self._to_dict(t) for t in transactions]
        result = self.db.table("transactions").insert(data).execute()
        return [self._to_entity(row) for row in result.data]

    async def get_spending_by_category(
        self,
        user_id: str,
        start_date: date,
        end_date: date,
    ) -> Dict[str, Decimal]:
        """Get spending aggregated by category."""
        # Using Supabase RPC or raw query would be better for aggregation
        # For simplicity, fetching and aggregating in Python
        query = (
            self.db.table("transactions")
            .select("category_id,amount")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .gte("date", start_date.isoformat())
            .lte("date", end_date.isoformat())
            .lt("amount", 0)  # Only expenses
        )

        result = query.execute()

        spending_by_category: Dict[str, Decimal] = {}
        for row in result.data:
            category_id = row.get("category_id")
            if category_id:
                amount = abs(Decimal(str(row["amount"])))
                spending_by_category[category_id] = spending_by_category.get(category_id, Decimal("0")) + amount

        return spending_by_category
