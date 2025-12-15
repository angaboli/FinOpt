"""Budgets API router."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from src.presentation.api.dependencies import get_current_user_id

router = APIRouter()


class CreateBudgetRequest(BaseModel):
    category_id: str
    amount: float
    period_start: str  # Date
    period_end: str  # Date
    warning_threshold: float = 0.8
    critical_threshold: float = 1.0


class BudgetResponse(BaseModel):
    id: str
    category_id: str
    amount: float
    period_start: str
    period_end: str
    warning_threshold: float
    critical_threshold: float
    is_active: bool


@router.post("/", response_model=BudgetResponse, status_code=201)
async def create_budget(
    request: CreateBudgetRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Create a budget."""
    raise HTTPException(status_code=501, detail="Implement budget creation")


@router.get("/", response_model=List[BudgetResponse])
async def list_budgets(user_id: str = Depends(get_current_user_id)):
    """List budgets."""
    raise HTTPException(status_code=501, detail="Implement list budgets")


@router.get("/{budget_id}/consumption")
async def get_budget_consumption(budget_id: str, user_id: str = Depends(get_current_user_id)):
    """Get budget consumption."""
    raise HTTPException(status_code=501, detail="Implement budget consumption")


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: str, user_id: str = Depends(get_current_user_id)):
    """Update budget."""
    raise HTTPException(status_code=501, detail="Implement update budget")


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(budget_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete budget."""
    raise HTTPException(status_code=501, detail="Implement delete budget")
