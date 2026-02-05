"""Insight repository implementation using SQLAlchemy."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import json

from src.domain.entities import InsightRecord
from src.domain.repositories import InsightRepository


class InsightRepositoryImpl(InsightRepository):
    """Insight repository implementation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _to_entity(self, data: Dict[str, Any]) -> InsightRecord:
        generated = data.get("generated_at")
        if isinstance(generated, str):
            generated = datetime.fromisoformat(generated)
        insight_data = data.get("data", {})
        if isinstance(insight_data, str):
            insight_data = json.loads(insight_data)
        return InsightRecord(
            id=str(data["id"]),
            user_id=str(data["user_id"]),
            month_year=data["month_year"],
            data=insight_data,
            income_estimate=Decimal(str(data["income_estimate"])) if data.get("income_estimate") else None,
            fixed_costs_estimate=Decimal(str(data["fixed_costs_estimate"])) if data.get("fixed_costs_estimate") else None,
            generated_at=generated,
        )

    async def create(self, insight: InsightRecord) -> InsightRecord:
        result = await self.db.execute(
            text("""
                INSERT INTO insights (id, user_id, month_year, data, income_estimate,
                    fixed_costs_estimate, generated_at)
                VALUES (:id, :user_id, :month_year, :data::jsonb, :income_estimate,
                    :fixed_costs_estimate, :generated_at)
                RETURNING *
            """),
            {
                "id": insight.id,
                "user_id": insight.user_id,
                "month_year": insight.month_year,
                "data": json.dumps(insight.data),
                "income_estimate": float(insight.income_estimate) if insight.income_estimate else None,
                "fixed_costs_estimate": float(insight.fixed_costs_estimate) if insight.fixed_costs_estimate else None,
                "generated_at": insight.generated_at,
            }
        )
        await self.db.commit()
        row = result.fetchone()
        return self._to_entity(row._asdict())

    async def get_by_month(self, user_id: str, month_year: str) -> Optional[InsightRecord]:
        result = await self.db.execute(
            text("""
                SELECT * FROM insights
                WHERE user_id = :user_id AND month_year = :month_year
                ORDER BY generated_at DESC LIMIT 1
            """),
            {"user_id": user_id, "month_year": month_year}
        )
        row = result.fetchone()
        return self._to_entity(row._asdict()) if row else None

    async def list_by_user(self, user_id: str, limit: int = 12) -> List[InsightRecord]:
        result = await self.db.execute(
            text("""
                SELECT * FROM insights
                WHERE user_id = :user_id
                ORDER BY generated_at DESC
                LIMIT :limit
            """),
            {"user_id": user_id, "limit": limit}
        )
        return [self._to_entity(row._asdict()) for row in result.fetchall()]
