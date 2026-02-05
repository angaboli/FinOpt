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
from src.infrastructure.repositories.account_repository_impl import AccountRepositoryImpl
from src.infrastructure.repositories.budget_repository_impl import BudgetRepositoryImpl, BudgetEventRepositoryImpl
from src.infrastructure.repositories.category_repository_impl import CategoryRepositoryImpl
from src.infrastructure.repositories.goal_repository_impl import GoalRepositoryImpl
from src.infrastructure.repositories.insight_repository_impl import InsightRepositoryImpl
from src.infrastructure.repositories.notification_repository_impl import (
    NotificationRepositoryImpl,
    NotificationPreferencesRepositoryImpl,
)
from src.infrastructure.services.llm_client_impl import AnthropicLLMClient
from src.infrastructure.services.push_notification_impl import ExpoPushNotificationService


def get_transaction_repository(db: AsyncSession = Depends(get_db)) -> TransactionRepositoryImpl:
    """Get transaction repository instance."""
    return TransactionRepositoryImpl(db)


def get_account_repository(db: AsyncSession = Depends(get_db)) -> AccountRepositoryImpl:
    """Get account repository instance."""
    return AccountRepositoryImpl(db)


def get_budget_repository(db: AsyncSession = Depends(get_db)) -> BudgetRepositoryImpl:
    """Get budget repository instance."""
    return BudgetRepositoryImpl(db)


def get_budget_event_repository(db: AsyncSession = Depends(get_db)) -> BudgetEventRepositoryImpl:
    """Get budget event repository instance."""
    return BudgetEventRepositoryImpl(db)


def get_category_repository(db: AsyncSession = Depends(get_db)) -> CategoryRepositoryImpl:
    """Get category repository instance."""
    return CategoryRepositoryImpl(db)


def get_goal_repository(db: AsyncSession = Depends(get_db)) -> GoalRepositoryImpl:
    """Get goal repository instance."""
    return GoalRepositoryImpl(db)


def get_insight_repository(db: AsyncSession = Depends(get_db)) -> InsightRepositoryImpl:
    """Get insight repository instance."""
    return InsightRepositoryImpl(db)


def get_notification_repository(db: AsyncSession = Depends(get_db)) -> NotificationRepositoryImpl:
    """Get notification repository instance."""
    return NotificationRepositoryImpl(db)


def get_notification_prefs_repository(db: AsyncSession = Depends(get_db)) -> NotificationPreferencesRepositoryImpl:
    """Get notification preferences repository instance."""
    return NotificationPreferencesRepositoryImpl(db)


def get_llm_client() -> AnthropicLLMClient:
    """Get LLM client instance."""
    return AnthropicLLMClient()


def get_push_service() -> ExpoPushNotificationService:
    """Get push notification service instance."""
    return ExpoPushNotificationService()
