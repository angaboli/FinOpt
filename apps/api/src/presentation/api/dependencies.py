"""API dependencies for dependency injection."""

from fastapi import Depends, HTTPException, status, Header
from typing import Optional
from supabase import Client

from src.infrastructure.database.connection import get_db
from src.config import settings


async def get_current_user_id(authorization: Optional[str] = Header(None), db: Client = Depends(get_db)) -> str:
    """
    Get current user ID from Supabase JWT token.
    This is a simplified version - in production, validate the JWT properly.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )

    token = authorization.replace("Bearer ", "")

    try:
        # Get user from Supabase using the token
        user = db.auth.get_user(token)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )
        return user.user.id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )


# Dependency injection helpers for repositories and services
# These would be initialized with proper dependency injection in production

from src.infrastructure.repositories.transaction_repository_impl import TransactionRepositoryImpl
from src.infrastructure.services.llm_client_impl import AnthropicLLMClient
from src.infrastructure.services.push_notification_impl import ExpoPushNotificationService


def get_transaction_repository(db: Client = Depends(get_db)) -> TransactionRepositoryImpl:
    """Get transaction repository instance."""
    return TransactionRepositoryImpl(db)


def get_llm_client() -> AnthropicLLMClient:
    """Get LLM client instance."""
    return AnthropicLLMClient()


def get_push_service() -> ExpoPushNotificationService:
    """Get push notification service instance."""
    return ExpoPushNotificationService()
