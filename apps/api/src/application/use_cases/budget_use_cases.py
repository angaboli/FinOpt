"""Budget use cases - Application business logic."""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from decimal import Decimal
import uuid

from src.domain.entities import Budget, BudgetEvent, Notification, NotificationType
from src.domain.repositories import (
    BudgetRepository,
    BudgetEventRepository,
    CategoryRepository,
    NotificationRepository,
    NotificationPreferencesRepository,
)
from src.domain.services import PushNotificationPort


class CreateBudgetUseCase:
    """Use case for creating a budget."""

    def __init__(
        self,
        budget_repo: BudgetRepository,
        category_repo: CategoryRepository,
    ):
        self.budget_repo = budget_repo
        self.category_repo = category_repo

    async def execute(
        self,
        user_id: str,
        category_id: str,
        amount: Decimal,
        period_start: date,
        period_end: date,
        warning_threshold: Decimal = Decimal("0.80"),
        critical_threshold: Decimal = Decimal("1.00"),
    ) -> Budget:
        """Create a budget."""

        # Verify category exists
        category = await self.category_repo.get_by_id(category_id)
        if not category:
            raise ValueError(f"Category {category_id} not found")

        # Check if budget already exists for this category and period
        existing = await self.budget_repo.get_by_category_and_period(
            user_id=user_id,
            category_id=category_id,
            period_start=period_start,
            period_end=period_end,
        )
        if existing:
            raise ValueError(f"Budget already exists for this category and period")

        # Create budget
        budget = Budget(
            id=str(uuid.uuid4()),
            user_id=user_id,
            category_id=category_id,
            amount=amount,
            period_start=period_start,
            period_end=period_end,
            warning_threshold=warning_threshold,
            critical_threshold=critical_threshold,
        )

        return await self.budget_repo.create(budget)


class UpdateBudgetUseCase:
    """Use case for updating a budget."""

    def __init__(self, budget_repo: BudgetRepository):
        self.budget_repo = budget_repo

    async def execute(self, budget_id: str, user_id: str, **updates: Any) -> Budget:
        """Update a budget."""

        budget = await self.budget_repo.get_by_id(budget_id, user_id)
        if not budget:
            raise ValueError(f"Budget {budget_id} not found")

        # Update fields
        for key, value in updates.items():
            if hasattr(budget, key) and value is not None:
                setattr(budget, key, value)

        budget.updated_at = datetime.utcnow()

        return await self.budget_repo.update(budget)


class DeleteBudgetUseCase:
    """Use case for deleting a budget."""

    def __init__(self, budget_repo: BudgetRepository):
        self.budget_repo = budget_repo

    async def execute(self, budget_id: str, user_id: str) -> bool:
        """Delete a budget."""
        return await self.budget_repo.delete(budget_id, user_id)


class ListBudgetsUseCase:
    """Use case for listing budgets."""

    def __init__(self, budget_repo: BudgetRepository):
        self.budget_repo = budget_repo

    async def execute(
        self,
        user_id: str,
        is_active: Optional[bool] = None,
        category_id: Optional[str] = None,
    ) -> List[Budget]:
        """List budgets for a user."""
        return await self.budget_repo.list_by_user(
            user_id=user_id,
            is_active=is_active,
            category_id=category_id,
        )


class GetBudgetConsumptionUseCase:
    """Use case for getting budget consumption."""

    def __init__(self, budget_repo: BudgetRepository):
        self.budget_repo = budget_repo

    async def execute(self, budget_id: str, user_id: str) -> Dict[str, Any]:
        """Get budget consumption."""
        return await self.budget_repo.get_consumption(budget_id, user_id)


class EvaluateBudgetThresholdsUseCase:
    """
    Use case for evaluating budget thresholds after transaction changes.
    This triggers notifications when thresholds are crossed.
    """

    def __init__(
        self,
        budget_repo: BudgetRepository,
        budget_event_repo: BudgetEventRepository,
        notification_repo: NotificationRepository,
        notification_prefs_repo: NotificationPreferencesRepository,
        push_service: Optional[PushNotificationPort] = None,
    ):
        self.budget_repo = budget_repo
        self.budget_event_repo = budget_event_repo
        self.notification_repo = notification_repo
        self.notification_prefs_repo = notification_prefs_repo
        self.push_service = push_service

    async def execute(self, user_id: str, category_id: str) -> List[BudgetEvent]:
        """
        Evaluate budgets for a category and create notifications if thresholds are crossed.
        Returns list of budget events created.
        """

        events_created = []

        # Get user notification preferences
        prefs = await self.notification_prefs_repo.get_by_user(user_id)
        if not prefs:
            return events_created

        # Get active budgets for this category
        budgets = await self.budget_repo.list_by_user(
            user_id=user_id,
            is_active=True,
            category_id=category_id,
        )

        for budget in budgets:
            # Get consumption
            consumption = await self.budget_repo.get_consumption(budget.id, user_id)
            spent = Decimal(str(consumption.get("spent", 0)))
            percentage = Decimal(str(consumption.get("percentage", 0))) / 100

            # Check threshold
            threshold_type = budget.check_threshold(spent)

            if threshold_type:
                # Create budget event
                event = BudgetEvent(
                    id=str(uuid.uuid4()),
                    budget_id=budget.id,
                    user_id=user_id,
                    event_type=threshold_type.upper(),
                    threshold_percentage=percentage * 100,
                    current_spent=spent,
                    budget_amount=budget.amount,
                )
                event = await self.budget_event_repo.create(event)
                events_created.append(event)

                # Create notification
                notification_enabled = (
                    prefs.budget_warnings_enabled if threshold_type == "warning"
                    else prefs.budget_exceeded_enabled
                )

                if notification_enabled:
                    # Get category name (simplified - in real implementation, fetch from repo)
                    category_name = "Budget"

                    notification = Notification(
                        id=str(uuid.uuid4()),
                        user_id=user_id,
                        type=(
                            NotificationType.BUDGET_WARNING
                            if threshold_type == "warning"
                            else NotificationType.BUDGET_EXCEEDED
                        ),
                        title=(
                            f"Budget {category_name} : Attention"
                            if threshold_type == "warning"
                            else f"Budget {category_name} dépassé"
                        ),
                        body=(
                            f"Vous avez atteint {percentage * 100:.0f}% de votre budget ({spent}€ / {budget.amount}€)"
                        ),
                        data={
                            "budget_id": budget.id,
                            "category_id": category_id,
                            "spent": float(spent),
                            "budget_amount": float(budget.amount),
                            "percentage": float(percentage * 100),
                        },
                    )
                    notification = await self.notification_repo.create(notification)

                    # Send push notification
                    if self.push_service and prefs.push_token:
                        try:
                            await self.push_service.send_notification(
                                push_token=prefs.push_token,
                                title=notification.title,
                                body=notification.body,
                                data=notification.data,
                            )
                            notification.mark_as_sent()
                            await self.notification_repo.create(notification)
                        except Exception as e:
                            # Log error but don't fail the operation
                            print(f"Failed to send push notification: {e}")

        return events_created


class RecalculateBudgetsUseCase:
    """
    Use case for recalculating all budgets after transaction import.
    This is typically called by a background worker.
    """

    def __init__(
        self,
        budget_repo: BudgetRepository,
        evaluate_thresholds_use_case: EvaluateBudgetThresholdsUseCase,
    ):
        self.budget_repo = budget_repo
        self.evaluate_thresholds_use_case = evaluate_thresholds_use_case

    async def execute(self, user_id: str, category_ids: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Recalculate budgets and check thresholds.
        If category_ids provided, only check those categories.
        """

        # Get all active budgets
        budgets = await self.budget_repo.list_by_user(user_id=user_id, is_active=True)

        # Filter by category_ids if provided
        if category_ids:
            budgets = [b for b in budgets if b.category_id in category_ids]

        # Get unique categories
        unique_categories = list(set(b.category_id for b in budgets))

        # Evaluate thresholds for each category
        total_events = []
        for category_id in unique_categories:
            events = await self.evaluate_thresholds_use_case.execute(user_id, category_id)
            total_events.extend(events)

        return {
            "budgets_evaluated": len(budgets),
            "categories_checked": len(unique_categories),
            "events_created": len(total_events),
        }
