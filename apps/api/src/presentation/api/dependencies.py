"""API dependencies for dependency injection."""

from fastapi import Depends, HTTPException, status, Header
from typing import Optional
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.database.connection import get_db
from src.config import settings


async def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """
    Get current user ID from JWT token.
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
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        return user_id
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )


# Dependency injection helpers for repositories and services

from src.infrastructure.repositories.transaction_repository_impl import TransactionRepositoryImpl
from src.infrastructure.services.llm_client_impl import AnthropicLLMClient
from src.infrastructure.services.push_notification_impl import ExpoPushNotificationService


def get_transaction_repository(db: AsyncSession = Depends(get_db)) -> TransactionRepositoryImpl:
    """Get transaction repository instance."""
    return TransactionRepositoryImpl(db)


def get_llm_client() -> AnthropicLLMClient:
    """Get LLM client instance."""
    return AnthropicLLMClient()


def get_push_service() -> ExpoPushNotificationService:
    """Get push notification service instance."""
    return ExpoPushNotificationService()
