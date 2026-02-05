"""Notification and NotificationPreferences repository implementations."""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
import json

from src.domain.entities import Notification, NotificationType, NotificationPreferences
from src.domain.repositories import NotificationRepository, NotificationPreferencesRepository


class NotificationRepositoryImpl(NotificationRepository):
    """Notification repository implementation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _to_entity(self, data: Dict[str, Any]) -> Notification:
        created = data.get("created_at")
        if isinstance(created, str):
            created = datetime.fromisoformat(created)
        sent = data.get("sent_at")
        if isinstance(sent, str):
            sent = datetime.fromisoformat(sent)
        notif_data = data.get("data")
        if isinstance(notif_data, str):
            notif_data = json.loads(notif_data)
        return Notification(
            id=str(data["id"]),
            user_id=str(data["user_id"]),
            type=NotificationType(data["type"]),
            title=data["title"],
            body=data["body"],
            data=notif_data,
            is_read=data.get("is_read", False),
            sent_at=sent,
            created_at=created,
        )

    async def create(self, notification: Notification) -> Notification:
        result = await self.db.execute(
            text("""
                INSERT INTO notifications (id, user_id, type, title, body, data, is_read, sent_at, created_at)
                VALUES (:id, :user_id, :type, :title, :body, :data::jsonb, :is_read, :sent_at, :created_at)
                RETURNING *
            """),
            {
                "id": notification.id,
                "user_id": notification.user_id,
                "type": notification.type.value,
                "title": notification.title,
                "body": notification.body,
                "data": json.dumps(notification.data) if notification.data else None,
                "is_read": notification.is_read,
                "sent_at": notification.sent_at,
                "created_at": notification.created_at,
            }
        )
        await self.db.commit()
        row = result.fetchone()
        return self._to_entity(row._asdict())

    async def get_by_id(self, notification_id: str, user_id: str) -> Optional[Notification]:
        result = await self.db.execute(
            text("SELECT * FROM notifications WHERE id = :id AND user_id = :user_id"),
            {"id": notification_id, "user_id": user_id}
        )
        row = result.fetchone()
        return self._to_entity(row._asdict()) if row else None

    async def list_by_user(
        self, user_id: str, is_read: Optional[bool] = None, page: int = 1, limit: int = 20
    ) -> tuple[List[Notification], int]:
        query = "SELECT * FROM notifications WHERE user_id = :user_id"
        count_query = "SELECT COUNT(*) FROM notifications WHERE user_id = :user_id"
        params: Dict[str, Any] = {"user_id": user_id}

        if is_read is not None:
            query += " AND is_read = :is_read"
            count_query += " AND is_read = :is_read"
            params["is_read"] = is_read

        # Count
        count_result = await self.db.execute(text(count_query), params)
        total = count_result.scalar() or 0

        # Paginate
        offset = (page - 1) * limit
        query += " ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
        params["limit"] = limit
        params["offset"] = offset

        result = await self.db.execute(text(query), params)
        notifications = [self._to_entity(row._asdict()) for row in result.fetchall()]

        return notifications, total

    async def mark_as_read(self, notification_id: str, user_id: str) -> bool:
        result = await self.db.execute(
            text("""
                UPDATE notifications SET is_read = true
                WHERE id = :id AND user_id = :user_id
                RETURNING id
            """),
            {"id": notification_id, "user_id": user_id}
        )
        await self.db.commit()
        return result.fetchone() is not None

    async def mark_all_as_read(self, user_id: str) -> int:
        result = await self.db.execute(
            text("""
                UPDATE notifications SET is_read = true
                WHERE user_id = :user_id AND is_read = false
            """),
            {"user_id": user_id}
        )
        await self.db.commit()
        return result.rowcount

    async def delete_old(self, days: int = 30) -> int:
        cutoff = datetime.utcnow() - timedelta(days=days)
        result = await self.db.execute(
            text("DELETE FROM notifications WHERE created_at < :cutoff AND is_read = true"),
            {"cutoff": cutoff}
        )
        await self.db.commit()
        return result.rowcount


class NotificationPreferencesRepositoryImpl(NotificationPreferencesRepository):
    """Notification preferences repository implementation."""

    def __init__(self, db: AsyncSession):
        self.db = db

    def _to_entity(self, data: Dict[str, Any]) -> NotificationPreferences:
        created = data.get("created_at")
        if isinstance(created, str):
            created = datetime.fromisoformat(created)
        updated = data.get("updated_at")
        if isinstance(updated, str):
            updated = datetime.fromisoformat(updated)
        return NotificationPreferences(
            id=str(data["id"]),
            user_id=str(data["user_id"]),
            budget_warnings_enabled=data.get("budget_warnings_enabled", True),
            budget_exceeded_enabled=data.get("budget_exceeded_enabled", True),
            anomaly_alerts_enabled=data.get("anomaly_alerts_enabled", True),
            insights_enabled=data.get("insights_enabled", True),
            warning_threshold=Decimal(str(data.get("warning_threshold", "0.80"))),
            critical_threshold=Decimal(str(data.get("critical_threshold", "1.00"))),
            push_token=data.get("push_token"),
            created_at=created,
            updated_at=updated,
        )

    async def get_by_user(self, user_id: str) -> Optional[NotificationPreferences]:
        result = await self.db.execute(
            text("SELECT * FROM notification_preferences WHERE user_id = :user_id"),
            {"user_id": user_id}
        )
        row = result.fetchone()
        return self._to_entity(row._asdict()) if row else None

    async def create_or_update(self, preferences: NotificationPreferences) -> NotificationPreferences:
        result = await self.db.execute(
            text("""
                INSERT INTO notification_preferences (id, user_id, budget_warnings_enabled,
                    budget_exceeded_enabled, anomaly_alerts_enabled, insights_enabled,
                    warning_threshold, critical_threshold, push_token, created_at, updated_at)
                VALUES (:id, :user_id, :budget_warnings_enabled, :budget_exceeded_enabled,
                    :anomaly_alerts_enabled, :insights_enabled, :warning_threshold,
                    :critical_threshold, :push_token, :created_at, :updated_at)
                ON CONFLICT (user_id) DO UPDATE SET
                    budget_warnings_enabled = EXCLUDED.budget_warnings_enabled,
                    budget_exceeded_enabled = EXCLUDED.budget_exceeded_enabled,
                    anomaly_alerts_enabled = EXCLUDED.anomaly_alerts_enabled,
                    insights_enabled = EXCLUDED.insights_enabled,
                    warning_threshold = EXCLUDED.warning_threshold,
                    critical_threshold = EXCLUDED.critical_threshold,
                    push_token = EXCLUDED.push_token,
                    updated_at = EXCLUDED.updated_at
                RETURNING *
            """),
            {
                "id": preferences.id,
                "user_id": preferences.user_id,
                "budget_warnings_enabled": preferences.budget_warnings_enabled,
                "budget_exceeded_enabled": preferences.budget_exceeded_enabled,
                "anomaly_alerts_enabled": preferences.anomaly_alerts_enabled,
                "insights_enabled": preferences.insights_enabled,
                "warning_threshold": float(preferences.warning_threshold),
                "critical_threshold": float(preferences.critical_threshold),
                "push_token": preferences.push_token,
                "created_at": preferences.created_at,
                "updated_at": datetime.utcnow(),
            }
        )
        await self.db.commit()
        row = result.fetchone()
        return self._to_entity(row._asdict())
