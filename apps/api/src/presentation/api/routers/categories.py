"""Categories API router."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Optional

from src.presentation.api.dependencies import (
    get_current_user_id,
    get_category_repository,
)
from src.infrastructure.repositories.category_repository_impl import CategoryRepositoryImpl

router = APIRouter()


class CategoryResponse(BaseModel):
    id: str
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    is_system: bool


@router.get("/", response_model=List[CategoryResponse])
async def list_categories(
    user_id: str = Depends(get_current_user_id),
    category_repo: CategoryRepositoryImpl = Depends(get_category_repository),
):
    """List all categories (system + user custom)."""
    categories = await category_repo.list_all(user_id=user_id)
    return [
        {
            "id": c.id,
            "name": c.name,
            "icon": c.icon,
            "color": c.color,
            "is_system": c.is_system,
        }
        for c in categories
    ]
