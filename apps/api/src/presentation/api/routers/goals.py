"""Goals API router."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from src.presentation.api.dependencies import get_current_user_id

router = APIRouter()


class CreateGoalRequest(BaseModel):
    title: str
    description: Optional[str] = None
    target_amount: float
    target_date: str  # Date
    priority: int = 1
    linked_account_id: Optional[str] = None


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


@router.post("/", response_model=GoalResponse, status_code=201)
async def create_goal(
    request: CreateGoalRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Create a financial goal."""
    raise HTTPException(status_code=501, detail="Implement goal creation")


@router.get("/", response_model=List[GoalResponse])
async def list_goals(user_id: str = Depends(get_current_user_id)):
    """List user goals."""
    raise HTTPException(status_code=501, detail="Implement list goals")


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(goal_id: str, user_id: str = Depends(get_current_user_id)):
    """Get goal by ID."""
    raise HTTPException(status_code=501, detail="Implement get goal")


@router.post("/{goal_id}/generate-plan")
async def generate_goal_plan(goal_id: str, user_id: str = Depends(get_current_user_id)):
    """Generate AI-powered plan for achieving the goal."""
    raise HTTPException(status_code=501, detail="Implement AI goal planning")


@router.put("/{goal_id}")
async def update_goal(goal_id: str, user_id: str = Depends(get_current_user_id)):
    """Update goal."""
    raise HTTPException(status_code=501, detail="Implement update goal")


@router.delete("/{goal_id}", status_code=204)
async def delete_goal(goal_id: str, user_id: str = Depends(get_current_user_id)):
    """Delete goal."""
    raise HTTPException(status_code=501, detail="Implement delete goal")
