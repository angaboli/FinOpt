"""Transaction repository implementation using SQLAlchemy."""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from src.domain.entities import Transaction, TransactionStatus
from src.domain.repositories import TransactionRepository


class TransactionRepositoryImpl(TransactionRepository):
    """Transaction repository implementation."""

    def __init__(self, db: AsyncSession):
        self.db = db

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
        result = await self.db.execute(
            text("""
                INSERT INTO transactions (id, user_id, account_id, amount, currency, date, description,
                    category_id, merchant_name, is_recurring, is_manual, status, notes, tags, metadata,
                    created_at, updated_at, deleted_at)
                VALUES (:id, :user_id, :account_id, :amount, :currency, :date, :description,
                    :category_id, :merchant_name, :is_recurring, :is_manual, :status, :notes, :tags, :metadata,
                    :created_at, :updated_at, :deleted_at)
                RETURNING *
            """),
            data
        )
        await self.db.commit()
        row = result.fetchone()
        return self._to_entity(row._asdict())

    async def get_by_id(self, transaction_id: str, user_id: str) -> Optional[Transaction]:
        """Get transaction by ID."""
        result = await self.db.execute(
            text("""
                SELECT * FROM transactions
                WHERE id = :id AND user_id = :user_id AND deleted_at IS NULL
            """),
            {"id": transaction_id, "user_id": user_id}
        )
        row = result.fetchone()
        return self._to_entity(row._asdict()) if row else None

    async def list_by_user(
        self,
        user_id: str,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[List[Transaction], int]:
        """List transactions for a user with filters."""
        # Build dynamic query
        where_clauses = ["user_id = :user_id", "deleted_at IS NULL"]
        params: Dict[str, Any] = {"user_id": user_id}
        
        if filters:
            if filters.get("account_id"):
                where_clauses.append("account_id = :account_id")
                params["account_id"] = filters["account_id"]
            if filters.get("category_id"):
                where_clauses.append("category_id = :category_id")
                params["category_id"] = filters["category_id"]
            if filters.get("start_date"):
                where_clauses.append("date >= :start_date")
                params["start_date"] = filters["start_date"]
            if filters.get("end_date"):
                where_clauses.append("date <= :end_date")
                params["end_date"] = filters["end_date"]
            if filters.get("min_amount"):
                where_clauses.append("amount >= :min_amount")
                params["min_amount"] = filters["min_amount"]
            if filters.get("max_amount"):
                where_clauses.append("amount <= :max_amount")
                params["max_amount"] = filters["max_amount"]
            if filters.get("is_manual") is not None:
                where_clauses.append("is_manual = :is_manual")
                params["is_manual"] = filters["is_manual"]
            if filters.get("search"):
                where_clauses.append("description ILIKE :search")
                params["search"] = f"%{filters['search']}%"
        
        where_sql = " AND ".join(where_clauses)
        
        # Get count
        count_result = await self.db.execute(
            text(f"SELECT COUNT(*) FROM transactions WHERE {where_sql}"),
            params
        )
        total = count_result.scalar() or 0
        
        # Get paginated results
        offset = (page - 1) * limit
        params["limit"] = limit
        params["offset"] = offset
        
        result = await self.db.execute(
            text(f"""
                SELECT * FROM transactions
                WHERE {where_sql}
                ORDER BY date DESC
                LIMIT :limit OFFSET :offset
            """),
            params
        )
        
        transactions = [self._to_entity(row._asdict()) for row in result.fetchall()]
        return transactions, total

    async def list_by_account(
        self,
        account_id: str,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Transaction]:
        """List transactions for an account."""
        where_clauses = ["account_id = :account_id", "user_id = :user_id", "deleted_at IS NULL"]
        params: Dict[str, Any] = {"account_id": account_id, "user_id": user_id}
        
        if start_date:
            where_clauses.append("date >= :start_date")
            params["start_date"] = start_date.isoformat()
        if end_date:
            where_clauses.append("date <= :end_date")
            params["end_date"] = end_date.isoformat()
        
        where_sql = " AND ".join(where_clauses)
        result = await self.db.execute(
            text(f"SELECT * FROM transactions WHERE {where_sql} ORDER BY date DESC"),
            params
        )
        return [self._to_entity(row._asdict()) for row in result.fetchall()]

    async def list_by_category(
        self,
        category_id: str,
        user_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
    ) -> List[Transaction]:
        """List transactions for a category."""
        where_clauses = ["category_id = :category_id", "user_id = :user_id", "deleted_at IS NULL"]
        params: Dict[str, Any] = {"category_id": category_id, "user_id": user_id}
        
        if start_date:
            where_clauses.append("date >= :start_date")
            params["start_date"] = start_date.isoformat()
        if end_date:
            where_clauses.append("date <= :end_date")
            params["end_date"] = end_date.isoformat()
        
        where_sql = " AND ".join(where_clauses)
        result = await self.db.execute(
            text(f"SELECT * FROM transactions WHERE {where_sql} ORDER BY date DESC"),
            params
        )
        return [self._to_entity(row._asdict()) for row in result.fetchall()]

    async def update(self, transaction: Transaction) -> Transaction:
        """Update transaction."""
        data = self._to_dict(transaction)
        data["tid"] = data.pop("id")  # Rename for query param
        data["tuser_id"] = data.pop("user_id")
        
        result = await self.db.execute(
            text("""
                UPDATE transactions SET
                    account_id = :account_id, amount = :amount, currency = :currency,
                    date = :date, description = :description, category_id = :category_id,
                    merchant_name = :merchant_name, is_recurring = :is_recurring,
                    is_manual = :is_manual, status = :status, notes = :notes,
                    tags = :tags, metadata = :metadata, updated_at = :updated_at, deleted_at = :deleted_at
                WHERE id = :tid AND user_id = :tuser_id
                RETURNING *
            """),
            data
        )
        await self.db.commit()
        row = result.fetchone()
        return self._to_entity(row._asdict())

    async def soft_delete(self, transaction_id: str, user_id: str) -> bool:
        """Soft delete transaction."""
        result = await self.db.execute(
            text("""
                UPDATE transactions SET deleted_at = :deleted_at
                WHERE id = :id AND user_id = :user_id
            """),
            {"deleted_at": datetime.utcnow().isoformat(), "id": transaction_id, "user_id": user_id}
        )
        await self.db.commit()
        return result.rowcount > 0

    async def bulk_create(self, transactions: List[Transaction]) -> List[Transaction]:
        """Bulk create transactions."""
        created = []
        for transaction in transactions:
            created.append(await self.create(transaction))
        return created

    async def get_spending_by_category(
        self,
        user_id: str,
        start_date: date,
        end_date: date,
    ) -> Dict[str, Decimal]:
        """Get spending aggregated by category."""
        result = await self.db.execute(
            text("""
                SELECT category_id, SUM(ABS(amount)) as total
                FROM transactions
                WHERE user_id = :user_id
                    AND deleted_at IS NULL
                    AND date >= :start_date
                    AND date <= :end_date
                    AND amount < 0
                    AND category_id IS NOT NULL
                GROUP BY category_id
            """),
            {"user_id": user_id, "start_date": start_date.isoformat(), "end_date": end_date.isoformat()}
        )
        
        spending_by_category: Dict[str, Decimal] = {}
        for row in result.fetchall():
            spending_by_category[row.category_id] = Decimal(str(row.total))
        
        return spending_by_category
