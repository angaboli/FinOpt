"""Notifications API router."""

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from decimal import Decimal

from src.presentation.api.dependencies import (
    get_current_user_id,
    get_notification_repository,
    get_notification_prefs_repository,
)
from src.infrastructure.repositories.notification_repository_impl import (
    NotificationRepositoryImpl,
    NotificationPreferencesRepositoryImpl,
)
from src.application.use_cases.notification_use_cases import (
    ListNotificationsUseCase,
    MarkAsReadUseCase,
    MarkAllAsReadUseCase,
    GetPreferencesUseCase,
    UpdatePreferencesUseCase,
)

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


class PreferencesResponse(BaseModel):
    budget_warnings_enabled: bool
    budget_exceeded_enabled: bool
    anomaly_alerts_enabled: bool
    insights_enabled: bool
    warning_threshold: float
    critical_threshold: float
    push_token: Optional[str] = None


def _notif_to_response(n) -> dict:
    return {
        "id": n.id,
        "type": n.type.value,
        "title": n.title,
        "body": n.body,
        "data": n.data,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    }


@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    is_read: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: str = Depends(get_current_user_id),
    notification_repo: NotificationRepositoryImpl = Depends(get_notification_repository),
):
    """List user notifications."""
    use_case = ListNotificationsUseCase(notification_repo)
    result = await use_case.execute(user_id=user_id, is_read=is_read, page=page, limit=limit)
    return [_notif_to_response(n) for n in result["notifications"]]


@router.put("/{notification_id}/read", status_code=204)
async def mark_as_read(
    notification_id: str,
    user_id: str = Depends(get_current_user_id),
    notification_repo: NotificationRepositoryImpl = Depends(get_notification_repository),
):
    """Mark notification as read."""
    use_case = MarkAsReadUseCase(notification_repo)
    success = await use_case.execute(notification_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")


@router.put("/read-all", status_code=204)
async def mark_all_as_read(
    user_id: str = Depends(get_current_user_id),
    notification_repo: NotificationRepositoryImpl = Depends(get_notification_repository),
):
    """Mark all notifications as read."""
    use_case = MarkAllAsReadUseCase(notification_repo)
    await use_case.execute(user_id)


@router.get("/preferences", response_model=PreferencesResponse)
async def get_preferences(
    user_id: str = Depends(get_current_user_id),
    prefs_repo: NotificationPreferencesRepositoryImpl = Depends(get_notification_prefs_repository),
):
    """Get notification preferences."""
    use_case = GetPreferencesUseCase(prefs_repo)
    prefs = await use_case.execute(user_id)
    if not prefs:
        return {
            "budget_warnings_enabled": True,
            "budget_exceeded_enabled": True,
            "anomaly_alerts_enabled": True,
            "insights_enabled": True,
            "warning_threshold": 0.80,
            "critical_threshold": 1.00,
            "push_token": None,
        }
    return {
        "budget_warnings_enabled": prefs.budget_warnings_enabled,
        "budget_exceeded_enabled": prefs.budget_exceeded_enabled,
        "anomaly_alerts_enabled": prefs.anomaly_alerts_enabled,
        "insights_enabled": prefs.insights_enabled,
        "warning_threshold": float(prefs.warning_threshold),
        "critical_threshold": float(prefs.critical_threshold),
        "push_token": prefs.push_token,
    }


@router.put("/preferences", response_model=PreferencesResponse)
async def update_preferences(
    request: UpdatePreferencesRequest,
    user_id: str = Depends(get_current_user_id),
    prefs_repo: NotificationPreferencesRepositoryImpl = Depends(get_notification_prefs_repository),
):
    """Update notification preferences."""
    use_case = UpdatePreferencesUseCase(prefs_repo)
    updates = request.model_dump(exclude_none=True)
    if "warning_threshold" in updates:
        updates["warning_threshold"] = Decimal(str(updates["warning_threshold"]))
    if "critical_threshold" in updates:
        updates["critical_threshold"] = Decimal(str(updates["critical_threshold"]))
    prefs = await use_case.execute(user_id, **updates)
    return {
        "budget_warnings_enabled": prefs.budget_warnings_enabled,
        "budget_exceeded_enabled": prefs.budget_exceeded_enabled,
        "anomaly_alerts_enabled": prefs.anomaly_alerts_enabled,
        "insights_enabled": prefs.insights_enabled,
        "warning_threshold": float(prefs.warning_threshold),
        "critical_threshold": float(prefs.critical_threshold),
        "push_token": prefs.push_token,
    }
