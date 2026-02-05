"""Goal repository implementation using SQLAlchemy."""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from src.domain.entities import Goal, GoalStatus
from src.domain.repositories import GoalRepository


class GoalRepositoryImpl(GoalRepository):
    """Goal repository implementation."""

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

    def _to_entity(self, data: Dict[str, Any]) -> Goal:
        return Goal(
            id=str(data["id"]),
            user_id=str(data["user_id"]),
            title=data["title"],
            target_amount=Decimal(str(data["target_amount"])),
            target_date=self._ensure_date(data["target_date"]),
            description=data.get("description"),
            current_amount=Decimal(str(data.get("current_amount", 0))),
            priority=data.get("priority", 1),
            linked_account_id=str(data["linked_account_id"]) if data.get("linked_account_id") else None,
            status=GoalStatus(data.get("status", "ACTIVE")),
            plan=data.get("plan"),
            created_at=self._ensure_datetime(data["created_at"]),
            updated_at=self._ensure_datetime(data["updated_at"]),
        )

    async def create(self, goal: Goal) -> Goal:
        result = await self.db.execute(
            text("""
                INSERT INTO goals (id, user_id, title, description, target_amount, current_amount,
                    target_date, priority, linked_account_id, status, plan, created_at, updated_at)
                VALUES (:id, :user_id, :title, :description, :target_amount, :current_amount,
                    :target_date, :priority, :linked_account_id, :status, :plan::jsonb, :created_at, :updated_at)
                RETURNING *
            """),
            {
                "id": goal.id,
                "user_id": goal.user_id,
                "title": goal.title,
                "description": goal.description,
                "target_amount": float(goal.target_amount),
                "current_amount": float(goal.current_amount),
                "target_date": goal.target_date,
                "priority": goal.priority,
                "linked_account_id": goal.linked_account_id,
                "status": goal.status.value,
                "plan": None,
                "created_at": goal.created_at,
                "updated_at": goal.updated_at,
            }
        )
        await self.db.commit()
        row = result.fetchone()
        return self._to_entity(row._asdict())

    async def get_by_id(self, goal_id: str, user_id: str) -> Optional[Goal]:
        result = await self.db.execute(
            text("SELECT * FROM goals WHERE id = :id AND user_id = :user_id"),
            {"id": goal_id, "user_id": user_id}
        )
        row = result.fetchone()
        return self._to_entity(row._asdict()) if row else None

    async def list_by_user(self, user_id: str, status: Optional[str] = None) -> List[Goal]:
        query = "SELECT * FROM goals WHERE user_id = :user_id"
        params: Dict[str, Any] = {"user_id": user_id}

        if status is not None:
            query += " AND status = :status"
            params["status"] = status

        query += " ORDER BY priority ASC, created_at DESC"

        result = await self.db.execute(text(query), params)
        return [self._to_entity(row._asdict()) for row in result.fetchall()]

    async def update(self, goal: Goal) -> Goal:
        import json
        result = await self.db.execute(
            text("""
                UPDATE goals
                SET title = :title, description = :description,
                    target_amount = :target_amount, current_amount = :current_amount,
                    target_date = :target_date, priority = :priority,
                    linked_account_id = :linked_account_id, status = :status,
                    plan = :plan::jsonb, updated_at = :updated_at
                WHERE id = :id AND user_id = :user_id
                RETURNING *
            """),
            {
                "id": goal.id,
                "user_id": goal.user_id,
                "title": goal.title,
                "description": goal.description,
                "target_amount": float(goal.target_amount),
                "current_amount": float(goal.current_amount),
                "target_date": goal.target_date,
                "priority": goal.priority,
                "linked_account_id": goal.linked_account_id,
                "status": goal.status.value,
                "plan": json.dumps(goal.plan) if goal.plan else None,
                "updated_at": datetime.utcnow(),
            }
        )
        await self.db.commit()
        row = result.fetchone()
        if not row:
            raise ValueError(f"Goal {goal.id} not found")
        return self._to_entity(row._asdict())

    async def delete(self, goal_id: str, user_id: str) -> bool:
        result = await self.db.execute(
            text("DELETE FROM goals WHERE id = :id AND user_id = :user_id RETURNING id"),
            {"id": goal_id, "user_id": user_id}
        )
        await self.db.commit()
        return result.fetchone() is not None
