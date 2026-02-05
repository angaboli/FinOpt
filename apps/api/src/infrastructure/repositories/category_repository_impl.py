"""Category repository implementation using SQLAlchemy."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from src.domain.entities import Category
from src.domain.repositories import CategoryRepository


class CategoryRepositoryImpl(CategoryRepository):
    """Category repository implementation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _to_entity(self, data: Dict[str, Any]) -> Category:
        created = data.get("created_at")
        if isinstance(created, str):
            created = datetime.fromisoformat(created)
        return Category(
            id=str(data["id"]),
            name=data["name"],
            user_id=str(data["user_id"]) if data.get("user_id") else None,
            icon=data.get("icon"),
            color=data.get("color"),
            is_system=data.get("is_system", False),
            parent_category_id=str(data["parent_category_id"]) if data.get("parent_category_id") else None,
            created_at=created,
        )

    async def create(self, category: Category) -> Category:
        result = await self.db.execute(
            text("""
                INSERT INTO categories (id, name, user_id, icon, color, is_system, parent_category_id, created_at)
                VALUES (:id, :name, :user_id, :icon, :color, :is_system, :parent_category_id, :created_at)
                RETURNING *
            """),
            {
                "id": category.id,
                "name": category.name,
                "user_id": category.user_id,
                "icon": category.icon,
                "color": category.color,
                "is_system": category.is_system,
                "parent_category_id": category.parent_category_id,
                "created_at": category.created_at,
            }
        )
        await self.db.commit()
        row = result.fetchone()
        return self._to_entity(row._asdict())

    async def get_by_id(self, category_id: str) -> Optional[Category]:
        result = await self.db.execute(
            text("SELECT * FROM categories WHERE id = :id"),
            {"id": category_id}
        )
        row = result.fetchone()
        return self._to_entity(row._asdict()) if row else None

    async def list_all(self, user_id: Optional[str] = None) -> List[Category]:
        if user_id:
            result = await self.db.execute(
                text("""
                    SELECT * FROM categories
                    WHERE is_system = true OR user_id = :user_id
                    ORDER BY is_system DESC, name ASC
                """),
                {"user_id": user_id}
            )
        else:
            result = await self.db.execute(
                text("SELECT * FROM categories WHERE is_system = true ORDER BY name ASC")
            )
        return [self._to_entity(row._asdict()) for row in result.fetchall()]

    async def update(self, category: Category) -> Category:
        result = await self.db.execute(
            text("""
                UPDATE categories
                SET name = :name, icon = :icon, color = :color,
                    parent_category_id = :parent_category_id
                WHERE id = :id AND (user_id = :user_id OR :user_id IS NULL)
                RETURNING *
            """),
            {
                "id": category.id,
                "name": category.name,
                "icon": category.icon,
                "color": category.color,
                "parent_category_id": category.parent_category_id,
                "user_id": category.user_id,
            }
        )
        await self.db.commit()
        row = result.fetchone()
        if not row:
            raise ValueError(f"Category {category.id} not found")
        return self._to_entity(row._asdict())

    async def delete(self, category_id: str, user_id: str) -> bool:
        result = await self.db.execute(
            text("""
                DELETE FROM categories
                WHERE id = :id AND user_id = :user_id AND is_system = false
                RETURNING id
            """),
            {"id": category_id, "user_id": user_id}
        )
        await self.db.commit()
        return result.fetchone() is not None
