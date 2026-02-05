"""Insights API router."""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional

from src.presentation.api.dependencies import (
    get_current_user_id,
    get_transaction_repository,
    get_account_repository,
    get_budget_repository,
    get_insight_repository,
    get_notification_repository,
    get_notification_prefs_repository,
    get_llm_client,
    get_push_service,
)
from src.infrastructure.repositories.transaction_repository_impl import TransactionRepositoryImpl
from src.infrastructure.repositories.account_repository_impl import AccountRepositoryImpl
from src.infrastructure.repositories.budget_repository_impl import BudgetRepositoryImpl
from src.infrastructure.repositories.insight_repository_impl import InsightRepositoryImpl
from src.infrastructure.repositories.notification_repository_impl import (
    NotificationRepositoryImpl,
    NotificationPreferencesRepositoryImpl,
)
from src.infrastructure.services.llm_client_impl import AnthropicLLMClient
from src.infrastructure.services.push_notification_impl import ExpoPushNotificationService
from src.application.use_cases.insight_use_cases import (
    GenerateMonthlyInsightsUseCase,
    GetInsightsUseCase,
    ListInsightsUseCase,
)

router = APIRouter()


class GenerateInsightsRequest(BaseModel):
    month_year: str  # Format: YYYY-MM


class InsightResponse(BaseModel):
    id: str
    month_year: str
    data: dict
    income_estimate: Optional[float] = None
    fixed_costs_estimate: Optional[float] = None
    generated_at: str


def _to_response(insight) -> dict:
    return {
        "id": insight.id,
        "month_year": insight.month_year,
        "data": insight.data,
        "income_estimate": float(insight.income_estimate) if insight.income_estimate else None,
        "fixed_costs_estimate": float(insight.fixed_costs_estimate) if insight.fixed_costs_estimate else None,
        "generated_at": insight.generated_at.isoformat() if insight.generated_at else None,
    }


@router.post("/generate", response_model=InsightResponse, status_code=201)
async def generate_insights(
    request: GenerateInsightsRequest,
    user_id: str = Depends(get_current_user_id),
    transaction_repo: TransactionRepositoryImpl = Depends(get_transaction_repository),
    account_repo: AccountRepositoryImpl = Depends(get_account_repository),
    budget_repo: BudgetRepositoryImpl = Depends(get_budget_repository),
    insight_repo: InsightRepositoryImpl = Depends(get_insight_repository),
    notification_repo: NotificationRepositoryImpl = Depends(get_notification_repository),
    notification_prefs_repo: NotificationPreferencesRepositoryImpl = Depends(get_notification_prefs_repository),
    llm_client: AnthropicLLMClient = Depends(get_llm_client),
    push_service: ExpoPushNotificationService = Depends(get_push_service),
):
    """Generate AI insights for a month."""
    use_case = GenerateMonthlyInsightsUseCase(
        transaction_repo=transaction_repo,
        account_repo=account_repo,
        budget_repo=budget_repo,
        insight_repo=insight_repo,
        notification_repo=notification_repo,
        notification_prefs_repo=notification_prefs_repo,
        llm_client=llm_client,
        push_service=push_service,
    )
    try:
        insight = await use_case.execute(user_id, request.month_year)
        return _to_response(insight)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{month_year}", response_model=InsightResponse)
async def get_insights(
    month_year: str,
    user_id: str = Depends(get_current_user_id),
    insight_repo: InsightRepositoryImpl = Depends(get_insight_repository),
):
    """Get insights for a specific month."""
    use_case = GetInsightsUseCase(insight_repo)
    insight = await use_case.execute(user_id, month_year)
    if not insight:
        raise HTTPException(status_code=404, detail=f"No insights found for {month_year}")
    return _to_response(insight)


@router.get("/", response_model=List[InsightResponse])
async def list_insights(
    user_id: str = Depends(get_current_user_id),
    insight_repo: InsightRepositoryImpl = Depends(get_insight_repository),
):
    """List insights history."""
    use_case = ListInsightsUseCase(insight_repo)
    insights = await use_case.execute(user_id)
    return [_to_response(i) for i in insights]
