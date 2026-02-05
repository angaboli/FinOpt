"""Budgets API router."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from decimal import Decimal

from src.presentation.api.dependencies import (
    get_current_user_id,
    get_budget_repository,
    get_category_repository,
)
from src.infrastructure.repositories.budget_repository_impl import BudgetRepositoryImpl
from src.infrastructure.repositories.category_repository_impl import CategoryRepositoryImpl
from src.application.use_cases.budget_use_cases import (
    CreateBudgetUseCase,
    UpdateBudgetUseCase,
    DeleteBudgetUseCase,
    ListBudgetsUseCase,
    GetBudgetConsumptionUseCase,
)

router = APIRouter()


class CreateBudgetRequest(BaseModel):
    category_id: str
    amount: float
    period_start: str  # Date YYYY-MM-DD
    period_end: str  # Date YYYY-MM-DD
    warning_threshold: float = 0.8
    critical_threshold: float = 1.0


class UpdateBudgetRequest(BaseModel):
    amount: Optional[float] = None
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    is_active: Optional[bool] = None


class BudgetResponse(BaseModel):
    id: str
    category_id: str
    amount: float
    period_start: str
    period_end: str
    warning_threshold: float
    critical_threshold: float
    is_active: bool


def _to_response(budget) -> dict:
    return {
        "id": budget.id,
        "category_id": budget.category_id,
        "amount": float(budget.amount),
        "period_start": str(budget.period_start),
        "period_end": str(budget.period_end),
        "warning_threshold": float(budget.warning_threshold),
        "critical_threshold": float(budget.critical_threshold),
        "is_active": budget.is_active,
    }


@router.post("/", response_model=BudgetResponse, status_code=201)
async def create_budget(
    request: CreateBudgetRequest,
    user_id: str = Depends(get_current_user_id),
    budget_repo: BudgetRepositoryImpl = Depends(get_budget_repository),
    category_repo: CategoryRepositoryImpl = Depends(get_category_repository),
):
    """Create a budget."""
    use_case = CreateBudgetUseCase(budget_repo, category_repo)
    try:
        budget = await use_case.execute(
            user_id=user_id,
            category_id=request.category_id,
            amount=Decimal(str(request.amount)),
            period_start=date.fromisoformat(request.period_start),
            period_end=date.fromisoformat(request.period_end),
            warning_threshold=Decimal(str(request.warning_threshold)),
            critical_threshold=Decimal(str(request.critical_threshold)),
        )
        return _to_response(budget)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[BudgetResponse])
async def list_budgets(
    is_active: Optional[bool] = None,
    category_id: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    budget_repo: BudgetRepositoryImpl = Depends(get_budget_repository),
):
    """List budgets."""
    use_case = ListBudgetsUseCase(budget_repo)
    budgets = await use_case.execute(user_id=user_id, is_active=is_active, category_id=category_id)
    return [_to_response(b) for b in budgets]


@router.get("/{budget_id}/consumption")
async def get_budget_consumption(
    budget_id: str,
    user_id: str = Depends(get_current_user_id),
    budget_repo: BudgetRepositoryImpl = Depends(get_budget_repository),
):
    """Get budget consumption."""
    use_case = GetBudgetConsumptionUseCase(budget_repo)
    return await use_case.execute(budget_id, user_id)


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: str,
    request: UpdateBudgetRequest,
    user_id: str = Depends(get_current_user_id),
    budget_repo: BudgetRepositoryImpl = Depends(get_budget_repository),
):
    """Update budget."""
    use_case = UpdateBudgetUseCase(budget_repo)
    updates = request.model_dump(exclude_none=True)
    if "amount" in updates:
        updates["amount"] = Decimal(str(updates["amount"]))
    if "warning_threshold" in updates:
        updates["warning_threshold"] = Decimal(str(updates["warning_threshold"]))
    if "critical_threshold" in updates:
        updates["critical_threshold"] = Decimal(str(updates["critical_threshold"]))
    try:
        budget = await use_case.execute(budget_id, user_id, **updates)
        return _to_response(budget)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: str,
    user_id: str = Depends(get_current_user_id),
    budget_repo: BudgetRepositoryImpl = Depends(get_budget_repository),
):
    """Delete budget."""
    use_case = DeleteBudgetUseCase(budget_repo)
    deleted = await use_case.execute(budget_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Budget not found")
