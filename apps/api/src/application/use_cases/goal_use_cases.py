"""Goal use cases - Application business logic."""

from typing import List, Optional, Any, Dict
from datetime import datetime
from decimal import Decimal
import uuid

from src.domain.entities import Goal, GoalStatus
from src.domain.repositories import GoalRepository
from src.domain.services import LLMClientPort


class CreateGoalUseCase:
    """Use case for creating a financial goal."""

    def __init__(self, goal_repo: GoalRepository):
        self.goal_repo = goal_repo

    async def execute(
        self,
        user_id: str,
        title: str,
        target_amount: Decimal,
        target_date: str,
        description: Optional[str] = None,
        priority: int = 1,
        linked_account_id: Optional[str] = None,
    ) -> Goal:
        from datetime import date as date_type
        goal = Goal(
            id=str(uuid.uuid4()),
            user_id=user_id,
            title=title,
            target_amount=target_amount,
            target_date=date_type.fromisoformat(target_date),
            description=description,
            priority=priority,
            linked_account_id=linked_account_id,
        )
        return await self.goal_repo.create(goal)


class UpdateGoalUseCase:
    """Use case for updating a goal."""

    def __init__(self, goal_repo: GoalRepository):
        self.goal_repo = goal_repo

    async def execute(self, goal_id: str, user_id: str, **updates: Any) -> Goal:
        goal = await self.goal_repo.get_by_id(goal_id, user_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        for key, value in updates.items():
            if hasattr(goal, key) and value is not None:
                setattr(goal, key, value)

        goal.updated_at = datetime.utcnow()
        return await self.goal_repo.update(goal)


class DeleteGoalUseCase:
    """Use case for deleting a goal."""

    def __init__(self, goal_repo: GoalRepository):
        self.goal_repo = goal_repo

    async def execute(self, goal_id: str, user_id: str) -> bool:
        return await self.goal_repo.delete(goal_id, user_id)


class ListGoalsUseCase:
    """Use case for listing goals."""

    def __init__(self, goal_repo: GoalRepository):
        self.goal_repo = goal_repo

    async def execute(self, user_id: str, status: Optional[str] = None) -> List[Goal]:
        return await self.goal_repo.list_by_user(user_id, status)


class GetGoalUseCase:
    """Use case for getting a single goal."""

    def __init__(self, goal_repo: GoalRepository):
        self.goal_repo = goal_repo

    async def execute(self, goal_id: str, user_id: str) -> Optional[Goal]:
        return await self.goal_repo.get_by_id(goal_id, user_id)


class GenerateGoalPlanUseCase:
    """Use case for generating an AI-powered savings plan for a goal."""

    def __init__(self, goal_repo: GoalRepository, llm_client: LLMClientPort):
        self.goal_repo = goal_repo
        self.llm_client = llm_client

    async def execute(self, goal_id: str, user_id: str) -> Goal:
        goal = await self.goal_repo.get_by_id(goal_id, user_id)
        if not goal:
            raise ValueError(f"Goal {goal_id} not found")

        remaining = goal.target_amount - goal.current_amount
        from datetime import date as date_type
        days_left = (goal.target_date - date_type.today()).days

        if days_left <= 0:
            raise ValueError("Goal target date has already passed")

        months_left = max(1, days_left // 30)
        monthly_saving = float(remaining) / months_left

        plan = {
            "monthly_saving_target": round(monthly_saving, 2),
            "months_remaining": months_left,
            "remaining_amount": float(remaining),
            "strategy": (
                "Épargnez régulièrement chaque mois pour atteindre votre objectif. "
                f"Montant mensuel recommandé : {monthly_saving:.2f}€"
            ),
        }

        goal.plan = plan
        goal.updated_at = datetime.utcnow()
        return await self.goal_repo.update(goal)
