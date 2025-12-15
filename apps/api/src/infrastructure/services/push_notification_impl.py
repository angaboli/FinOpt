"""Push notification service implementation using Expo."""

from typing import List, Dict, Any, Optional
import httpx

from src.domain.services import PushNotificationPort
from src.config import settings


class ExpoPushNotificationService(PushNotificationPort):
    """Expo push notification service implementation."""

    def __init__(self):
        self.expo_url = "https://exp.host/--/api/v2/push/send"
        self.access_token = settings.expo_access_token

    async def send_notification(
        self,
        push_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """Send a single push notification."""

        if not push_token or not push_token.startswith("ExponentPushToken["):
            return False

        payload = {
            "to": push_token,
            "title": title,
            "body": body,
            "data": data or {},
            "sound": "default",
            "priority": "high",
        }

        try:
            async with httpx.AsyncClient() as client:
                headers = {}
                if self.access_token:
                    headers["Authorization"] = f"Bearer {self.access_token}"

                response = await client.post(
                    self.expo_url,
                    json=payload,
                    headers=headers,
                    timeout=10.0,
                )

                if response.status_code == 200:
                    result = response.json()
                    return result.get("data", {}).get("status") == "ok"

                return False

        except Exception as e:
            print(f"Failed to send push notification: {e}")
            return False

    async def send_batch_notifications(
        self,
        notifications: List[Dict[str, Any]],
    ) -> List[bool]:
        """Send batch push notifications."""

        if not notifications:
            return []

        # Prepare payloads
        payloads = []
        for notif in notifications:
            push_token = notif.get("push_token")
            if not push_token or not push_token.startswith("ExponentPushToken["):
                continue

            payloads.append({
                "to": push_token,
                "title": notif.get("title", ""),
                "body": notif.get("body", ""),
                "data": notif.get("data", {}),
                "sound": "default",
                "priority": "high",
            })

        if not payloads:
            return [False] * len(notifications)

        try:
            async with httpx.AsyncClient() as client:
                headers = {}
                if self.access_token:
                    headers["Authorization"] = f"Bearer {self.access_token}"

                response = await client.post(
                    self.expo_url,
                    json=payloads,
                    headers=headers,
                    timeout=30.0,
                )

                if response.status_code == 200:
                    result = response.json()
                    data = result.get("data", [])
                    return [item.get("status") == "ok" for item in data]

                return [False] * len(payloads)

        except Exception as e:
            print(f"Failed to send batch notifications: {e}")
            return [False] * len(payloads)
