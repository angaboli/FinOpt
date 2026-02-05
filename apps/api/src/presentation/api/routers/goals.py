"""Goals API router."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

from src.presentation.api.dependencies import (
    get_current_user_id,
    get_goal_repository,
    get_llm_client,
)
from src.infrastructure.repositories.goal_repository_impl import GoalRepositoryImpl
from src.infrastructure.services.llm_client_impl import AnthropicLLMClient
from src.application.use_cases.goal_use_cases import (
    CreateGoalUseCase,
    UpdateGoalUseCase,
    DeleteGoalUseCase,
    ListGoalsUseCase,
    GetGoalUseCase,
    GenerateGoalPlanUseCase,
)

router = APIRouter()


class CreateGoalRequest(BaseModel):
    title: str
    description: Optional[str] = None
    target_amount: float
    target_date: str  # Date YYYY-MM-DD
    priority: int = 1
    linked_account_id: Optional[str] = None


class UpdateGoalRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    target_date: Optional[str] = None
    priority: Optional[int] = None
    status: Optional[str] = None


class GoalResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    target_amount: float
    current_amount: float
    target_date: str
    priority: int
    status: str
    plan: Optional[dict] = None
    progress_percentage: float
    created_at: str


def _to_response(goal) -> dict:
    return {
        "id": goal.id,
        "title": goal.title,
        "description": goal.description,
        "target_amount": float(goal.target_amount),
        "current_amount": float(goal.current_amount),
        "target_date": str(goal.target_date),
        "priority": goal.priority,
        "status": goal.status.value,
        "plan": goal.plan,
        "progress_percentage": float(goal.get_progress_percentage()),
        "created_at": goal.created_at.isoformat() if goal.created_at else None,
    }


@router.post("/", response_model=GoalResponse, status_code=201)
async def create_goal(
    request: CreateGoalRequest,
    user_id: str = Depends(get_current_user_id),
    goal_repo: GoalRepositoryImpl = Depends(get_goal_repository),
):
    """Create a financial goal."""
    use_case = CreateGoalUseCase(goal_repo)
    try:
        goal = await use_case.execute(
            user_id=user_id,
            title=request.title,
            target_amount=Decimal(str(request.target_amount)),
            target_date=request.target_date,
            description=request.description,
            priority=request.priority,
            linked_account_id=request.linked_account_id,
        )
        return _to_response(goal)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[GoalResponse])
async def list_goals(
    status: Optional[str] = None,
    user_id: str = Depends(get_current_user_id),
    goal_repo: GoalRepositoryImpl = Depends(get_goal_repository),
):
    """List user goals."""
    use_case = ListGoalsUseCase(goal_repo)
    goals = await use_case.execute(user_id, status=status)
    return [_to_response(g) for g in goals]


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    goal_repo: GoalRepositoryImpl = Depends(get_goal_repository),
):
    """Get goal by ID."""
    use_case = GetGoalUseCase(goal_repo)
    goal = await use_case.execute(goal_id, user_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return _to_response(goal)


@router.post("/{goal_id}/generate-plan", response_model=GoalResponse)
async def generate_goal_plan(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    goal_repo: GoalRepositoryImpl = Depends(get_goal_repository),
    llm_client: AnthropicLLMClient = Depends(get_llm_client),
):
    """Generate AI-powered plan for achieving the goal."""
    use_case = GenerateGoalPlanUseCase(goal_repo, llm_client)
    try:
        goal = await use_case.execute(goal_id, user_id)
        return _to_response(goal)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: str,
    request: UpdateGoalRequest,
    user_id: str = Depends(get_current_user_id),
    goal_repo: GoalRepositoryImpl = Depends(get_goal_repository),
):
    """Update goal."""
    use_case = UpdateGoalUseCase(goal_repo)
    updates = request.model_dump(exclude_none=True)
    if "target_amount" in updates:
        updates["target_amount"] = Decimal(str(updates["target_amount"]))
    if "current_amount" in updates:
        updates["current_amount"] = Decimal(str(updates["current_amount"]))
    if "target_date" in updates:
        from datetime import date
        updates["target_date"] = date.fromisoformat(updates["target_date"])
    if "status" in updates:
        from src.domain.entities import GoalStatus
        updates["status"] = GoalStatus(updates["status"])
    try:
        goal = await use_case.execute(goal_id, user_id, **updates)
        return _to_response(goal)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(
    goal_id: str,
    user_id: str = Depends(get_current_user_id),
    goal_repo: GoalRepositoryImpl = Depends(get_goal_repository),
):
    """Delete goal."""
    use_case = DeleteGoalUseCase(goal_repo)
    deleted = await use_case.execute(goal_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Goal not found")
