"""Notifications API router."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from src.presentation.api.dependencies import get_current_user_id

router = APIRouter()


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    body: str
    data: Optional[dict] = None
    is_read: bool
    created_at: str


class UpdatePreferencesRequest(BaseModel):
    budget_warnings_enabled: Optional[bool] = None
    budget_exceeded_enabled: Optional[bool] = None
    anomaly_alerts_enabled: Optional[bool] = None
    insights_enabled: Optional[bool] = None
    warning_threshold: Optional[float] = None
    critical_threshold: Optional[float] = None
    push_token: Optional[str] = None


@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(user_id: str = Depends(get_current_user_id)):
    """List user notifications."""
    raise HTTPException(status_code=501, detail="Implement list notifications")


@router.put("/{notification_id}/read", status_code=204)
async def mark_as_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Mark notification as read."""
    raise HTTPException(status_code=501, detail="Implement mark as read")


@router.put("/read-all", status_code=204)
async def mark_all_as_read(user_id: str = Depends(get_current_user_id)):
    """Mark all notifications as read."""
    raise HTTPException(status_code=501, detail="Implement mark all as read")


@router.get("/preferences")
async def get_preferences(user_id: str = Depends(get_current_user_id)):
    """Get notification preferences."""
    raise HTTPException(status_code=501, detail="Implement get preferences")


@router.put("/preferences")
async def update_preferences(
    request: UpdatePreferencesRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Update notification preferences."""
    raise HTTPException(status_code=501, detail="Implement update preferences")
