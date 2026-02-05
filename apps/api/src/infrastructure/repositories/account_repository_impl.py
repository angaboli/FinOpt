"""Account repository implementation using SQLAlchemy."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from src.domain.entities import Account, AccountType, OwnerScope
from src.domain.repositories import AccountRepository


class AccountRepositoryImpl(AccountRepository):
    """Account repository implementation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _ensure_datetime(self, value):
        """Convert value to datetime if it's a string, otherwise return as-is."""
        if isinstance(value, str):
            return datetime.fromisoformat(value)
        return value

    def _to_entity(self, data: Dict[str, Any]) -> Account:
        """Convert database row to entity."""
        return Account(
            id=str(data["id"]),
            user_id=str(data["user_id"]),
            name=data["name"],
            type=AccountType(data["type"]),
            owner_scope=OwnerScope(data["owner_scope"]),
            currency=data["currency"],
            balance=Decimal(str(data["balance"])),
            bank_name=data.get("bank_name"),
            iban_last4=data.get("iban_last4"),
            is_active=data.get("is_active", True),
            created_at=self._ensure_datetime(data["created_at"]),
            updated_at=self._ensure_datetime(data["updated_at"]),
        )

    def _to_dict(self, account: Account) -> Dict[str, Any]:
        """Convert entity to database dict."""
        return {
            "id": account.id,
            "user_id": account.user_id,
            "name": account.name,
            "type": account.type.value,
            "owner_scope": account.owner_scope.value,
            "currency": account.currency,
            "balance": float(account.balance),
            "bank_name": account.bank_name,
            "iban_last4": account.iban_last4,
            "is_active": account.is_active,
            "created_at": account.created_at,
            "updated_at": account.updated_at,
        }

    async def create(self, account: Account) -> Account:
        """Create a new account."""
        data = self._to_dict(account)
        result = await self.db.execute(
            text("""
                INSERT INTO accounts (id, user_id, name, type, owner_scope, currency, balance,
                    bank_name, iban_last4, is_active, created_at, updated_at)
                VALUES (:id, :user_id, :name, :type, :owner_scope, :currency, :balance,
                    :bank_name, :iban_last4, :is_active, :created_at, :updated_at)
                RETURNING *
            """),
            data
        )
        await self.db.commit()
        row = result.fetchone()
        return self._to_entity(row._asdict())

    async def get_by_id(self, account_id: str, user_id: str) -> Optional[Account]:
        """Get account by ID."""
        result = await self.db.execute(
            text("""
                SELECT * FROM accounts
                WHERE id = :id AND user_id = :user_id
            """),
            {"id": account_id, "user_id": user_id}
        )
        row = result.fetchone()
        return self._to_entity(row._asdict()) if row else None

    async def list_by_user(self, user_id: str, is_active: Optional[bool] = None) -> List[Account]:
        """List all accounts for a user."""
        query = "SELECT * FROM accounts WHERE user_id = :user_id"
        params = {"user_id": user_id}

        if is_active is not None:
            query += " AND is_active = :is_active"
            params["is_active"] = is_active

        query += " ORDER BY created_at DESC"

        result = await self.db.execute(text(query), params)
        rows = result.fetchall()
        return [self._to_entity(row._asdict()) for row in rows]

    async def update(self, account: Account) -> Account:
        """Update account."""
        data = self._to_dict(account)
        result = await self.db.execute(
            text("""
                UPDATE accounts
                SET name = :name, type = :type, owner_scope = :owner_scope, currency = :currency,
                    balance = :balance, bank_name = :bank_name, iban_last4 = :iban_last4,
                    is_active = :is_active, updated_at = :updated_at
                WHERE id = :id AND user_id = :user_id
                RETURNING *
            """),
            data
        )
        await self.db.commit()
        row = result.fetchone()
        if not row:
            raise ValueError(f"Account {account.id} not found")
        return self._to_entity(row._asdict())

    async def delete(self, account_id: str, user_id: str) -> bool:
        """Delete account (soft delete by marking as inactive)."""
        result = await self.db.execute(
            text("""
                UPDATE accounts
                SET is_active = false, updated_at = :updated_at
                WHERE id = :id AND user_id = :user_id
                RETURNING id
            """),
            {
                "id": account_id,
                "user_id": user_id,
                "updated_at": datetime.utcnow()
            }
        )
        await self.db.commit()
        return result.fetchone() is not None

    async def update_balance(self, account_id: str, user_id: str, new_balance: Decimal) -> Account:
        """Update account balance."""
        result = await self.db.execute(
            text("""
                UPDATE accounts
                SET balance = :balance, updated_at = :updated_at
                WHERE id = :id AND user_id = :user_id
                RETURNING *
            """),
            {
                "id": account_id,
                "user_id": user_id,
                "balance": float(new_balance),
                "updated_at": datetime.utcnow()
            }
        )
        await self.db.commit()
        row = result.fetchone()
        if not row:
            raise ValueError(f"Account {account_id} not found")
        return self._to_entity(row._asdict())
