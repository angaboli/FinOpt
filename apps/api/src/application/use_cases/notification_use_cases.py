"""Notification use cases - Application business logic."""

from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
import uuid

from src.domain.entities import NotificationPreferences
from src.domain.repositories import NotificationRepository, NotificationPreferencesRepository


class ListNotificationsUseCase:
    """Use case for listing notifications."""

    def __init__(self, notification_repo: NotificationRepository):
        self.notification_repo = notification_repo

    async def execute(
        self, user_id: str, is_read: Optional[bool] = None, page: int = 1, limit: int = 20
    ) -> Dict[str, Any]:
        notifications, total = await self.notification_repo.list_by_user(
            user_id=user_id, is_read=is_read, page=page, limit=limit
        )
        return {
            "notifications": notifications,
            "total": total,
            "page": page,
            "limit": limit,
        }


class MarkAsReadUseCase:
    """Use case for marking a notification as read."""

    def __init__(self, notification_repo: NotificationRepository):
        self.notification_repo = notification_repo

    async def execute(self, notification_id: str, user_id: str) -> bool:
        return await self.notification_repo.mark_as_read(notification_id, user_id)


class MarkAllAsReadUseCase:
    """Use case for marking all notifications as read."""

    def __init__(self, notification_repo: NotificationRepository):
        self.notification_repo = notification_repo

    async def execute(self, user_id: str) -> int:
        return await self.notification_repo.mark_all_as_read(user_id)


class GetPreferencesUseCase:
    """Use case for getting notification preferences."""

    def __init__(self, prefs_repo: NotificationPreferencesRepository):
        self.prefs_repo = prefs_repo

    async def execute(self, user_id: str) -> Optional[NotificationPreferences]:
        return await self.prefs_repo.get_by_user(user_id)


class UpdatePreferencesUseCase:
    """Use case for updating notification preferences."""

    def __init__(self, prefs_repo: NotificationPreferencesRepository):
        self.prefs_repo = prefs_repo

    async def execute(self, user_id: str, **updates: Any) -> NotificationPreferences:
        existing = await self.prefs_repo.get_by_user(user_id)

        if existing:
            for key, value in updates.items():
                if hasattr(existing, key) and value is not None:
                    setattr(existing, key, value)
            existing.updated_at = datetime.utcnow()
            return await self.prefs_repo.create_or_update(existing)
        else:
            prefs = NotificationPreferences(
                id=str(uuid.uuid4()),
                user_id=user_id,
            )
            for key, value in updates.items():
                if hasattr(prefs, key) and value is not None:
                    setattr(prefs, key, value)
            return await self.prefs_repo.create_or_update(prefs)
