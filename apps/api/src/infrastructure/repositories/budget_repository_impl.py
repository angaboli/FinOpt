"""Budget and BudgetEvent repository implementations using SQLAlchemy."""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from src.domain.entities import Budget, BudgetEvent
from src.domain.repositories import BudgetRepository, BudgetEventRepository


class BudgetRepositoryImpl(BudgetRepository):
    """Budget repository implementation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _ensure_datetime(self, value):
        if isinstance(value, str):
            return datetime.fromisoformat(value)
        return value

    def _ensure_date(self, value):
        if isinstance(value, str):
            return date.fromisoformat(value)
        if isinstance(value, datetime):
            return value.date()
        return value

    def _to_entity(self, data: Dict[str, Any]) -> Budget:
        return Budget(
            id=str(data["id"]),
            user_id=str(data["user_id"]),
            category_id=str(data["category_id"]),
            amount=Decimal(str(data["amount"])),
            period_start=self._ensure_date(data["period_start"]),
            period_end=self._ensure_date(data["period_end"]),
            warning_threshold=Decimal(str(data["warning_threshold"])),
            critical_threshold=Decimal(str(data["critical_threshold"])),
            is_active=data.get("is_active", True),
            created_at=self._ensure_datetime(data["created_at"]),
            updated_at=self._ensure_datetime(data["updated_at"]),
        )

    async def create(self, budget: Budget) -> Budget:
        result = await self.db.execute(
            text("""
                INSERT INTO budgets (id, user_id, category_id, amount, period_start, period_end,
                    warning_threshold, critical_threshold, is_active, created_at, updated_at)
                VALUES (:id, :user_id, :category_id, :amount, :period_start, :period_end,
                    :warning_threshold, :critical_threshold, :is_active, :created_at, :updated_at)
                RETURNING *
            """),
            {
                "id": budget.id,
                "user_id": budget.user_id,
                "category_id": budget.category_id,
                "amount": float(budget.amount),
                "period_start": budget.period_start,
                "period_end": budget.period_end,
                "warning_threshold": float(budget.warning_threshold),
                "critical_threshold": float(budget.critical_threshold),
                "is_active": budget.is_active,
                "created_at": budget.created_at,
                "updated_at": budget.updated_at,
            }
        )
        await self.db.commit()
        row = result.fetchone()
        return self._to_entity(row._asdict())

    async def get_by_id(self, budget_id: str, user_id: str) -> Optional[Budget]:
        result = await self.db.execute(
            text("SELECT * FROM budgets WHERE id = :id AND user_id = :user_id"),
            {"id": budget_id, "user_id": user_id}
        )
        row = result.fetchone()
        return self._to_entity(row._asdict()) if row else None

    async def list_by_user(
        self, user_id: str, is_active: Optional[bool] = None, category_id: Optional[str] = None
    ) -> List[Budget]:
        query = "SELECT * FROM budgets WHERE user_id = :user_id"
        params: Dict[str, Any] = {"user_id": user_id}

        if is_active is not None:
            query += " AND is_active = :is_active"
            params["is_active"] = is_active

        if category_id is not None:
            query += " AND category_id = :category_id"
            params["category_id"] = category_id

        query += " ORDER BY created_at DESC"

        result = await self.db.execute(text(query), params)
        rows = result.fetchall()
        return [self._to_entity(row._asdict()) for row in rows]

    async def get_by_category_and_period(
        self, user_id: str, category_id: str, period_start: date, period_end: date
    ) -> Optional[Budget]:
        result = await self.db.execute(
            text("""
                SELECT * FROM budgets
                WHERE user_id = :user_id AND category_id = :category_id
                    AND period_start = :period_start AND period_end = :period_end
                    AND is_active = true
            """),
            {
                "user_id": user_id,
                "category_id": category_id,
                "period_start": period_start,
                "period_end": period_end,
            }
        )
        row = result.fetchone()
        return self._to_entity(row._asdict()) if row else None

    async def update(self, budget: Budget) -> Budget:
        result = await self.db.execute(
            text("""
                UPDATE budgets
                SET category_id = :category_id, amount = :amount,
                    period_start = :period_start, period_end = :period_end,
                    warning_threshold = :warning_threshold, critical_threshold = :critical_threshold,
                    is_active = :is_active, updated_at = :updated_at
                WHERE id = :id AND user_id = :user_id
                RETURNING *
            """),
            {
                "id": budget.id,
                "user_id": budget.user_id,
                "category_id": budget.category_id,
                "amount": float(budget.amount),
                "period_start": budget.period_start,
                "period_end": budget.period_end,
                "warning_threshold": float(budget.warning_threshold),
                "critical_threshold": float(budget.critical_threshold),
                "is_active": budget.is_active,
                "updated_at": datetime.utcnow(),
            }
        )
        await self.db.commit()
        row = result.fetchone()
        if not row:
            raise ValueError(f"Budget {budget.id} not found")
        return self._to_entity(row._asdict())

    async def delete(self, budget_id: str, user_id: str) -> bool:
        result = await self.db.execute(
            text("""
                UPDATE budgets SET is_active = false, updated_at = :updated_at
                WHERE id = :id AND user_id = :user_id
                RETURNING id
            """),
            {"id": budget_id, "user_id": user_id, "updated_at": datetime.utcnow()}
        )
        await self.db.commit()
        return result.fetchone() is not None

    async def get_consumption(self, budget_id: str, user_id: str) -> Dict[str, Any]:
        result = await self.db.execute(
            text("SELECT * FROM get_budget_consumption(:budget_id::uuid)"),
            {"budget_id": budget_id}
        )
        row = result.fetchone()
        if row:
            d = row._asdict()
            return {
                "budget_id": str(d["budget_id"]),
                "budget_amount": float(d["budget_amount"]),
                "spent": float(d["spent"]),
                "percentage": float(d["percentage"]),
            }
        return {"budget_id": budget_id, "budget_amount": 0, "spent": 0, "percentage": 0}


class BudgetEventRepositoryImpl(BudgetEventRepository):
    """Budget event repository implementation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _to_entity(self, data: Dict[str, Any]) -> BudgetEvent:
        triggered = data.get("triggered_at")
        if isinstance(triggered, str):
            triggered = datetime.fromisoformat(triggered)
        return BudgetEvent(
            id=str(data["id"]),
            budget_id=str(data["budget_id"]),
            user_id=str(data["user_id"]),
            event_type=data["event_type"],
            threshold_percentage=Decimal(str(data["threshold_percentage"])),
            current_spent=Decimal(str(data["current_spent"])),
            budget_amount=Decimal(str(data["budget_amount"])),
            triggered_at=triggered,
        )

    async def create(self, event: BudgetEvent) -> BudgetEvent:
        result = await self.db.execute(
            text("""
                INSERT INTO budget_events (id, budget_id, user_id, event_type,
                    threshold_percentage, current_spent, budget_amount, triggered_at)
                VALUES (:id, :budget_id, :user_id, :event_type,
                    :threshold_percentage, :current_spent, :budget_amount, :triggered_at)
                RETURNING *
            """),
            {
                "id": event.id,
                "budget_id": event.budget_id,
                "user_id": event.user_id,
                "event_type": event.event_type,
                "threshold_percentage": float(event.threshold_percentage),
                "current_spent": float(event.current_spent),
                "budget_amount": float(event.budget_amount),
                "triggered_at": event.triggered_at,
            }
        )
        await self.db.commit()
        row = result.fetchone()
        return self._to_entity(row._asdict())

    async def list_by_budget(self, budget_id: str, user_id: str) -> List[BudgetEvent]:
        result = await self.db.execute(
            text("""
                SELECT * FROM budget_events
                WHERE budget_id = :budget_id AND user_id = :user_id
                ORDER BY triggered_at DESC
            """),
            {"budget_id": budget_id, "user_id": user_id}
        )
        return [self._to_entity(row._asdict()) for row in result.fetchall()]

    async def list_by_user(self, user_id: str, limit: int = 50) -> List[BudgetEvent]:
        result = await self.db.execute(
            text("""
                SELECT * FROM budget_events
                WHERE user_id = :user_id
                ORDER BY triggered_at DESC
                LIMIT :limit
            """),
            {"user_id": user_id, "limit": limit}
        )
        return [self._to_entity(row._asdict()) for row in result.fetchall()]
