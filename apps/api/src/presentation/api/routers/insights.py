"""Insights API router."""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List

from src.presentation.api.dependencies import get_current_user_id

router = APIRouter()


class GenerateInsightsRequest(BaseModel):
    month_year: str  # Format: YYYY-MM


class InsightResponse(BaseModel):
    id: str
    month_year: str
    data: dict
    generated_at: str


@router.post("/generate", response_model=InsightResponse, status_code=202)
async def generate_insights(
    request: GenerateInsightsRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate AI insights for a month.
    This triggers an async task and returns immediately.
    """
    raise HTTPException(status_code=501, detail="Implement insights generation with worker")


@router.get("/{month_year}", response_model=InsightResponse)
async def get_insights(
    month_year: str,
    user_id: str = Depends(get_current_user_id),
):
    """Get insights for a specific month."""
    raise HTTPException(status_code=501, detail="Implement get insights")


@router.get("/", response_model=List[InsightResponse])
async def list_insights(user_id: str = Depends(get_current_user_id)):
    """List insights history."""
    raise HTTPException(status_code=501, detail="Implement list insights")
