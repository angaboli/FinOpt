from __future__ import annotations

from src.application.savings_goals.dtos import (
    CreateSavingsGoalCommand,
    DeleteSavingsGoalCommand,
    ListSavingsGoalsQuery,
    SavingsGoalResult,
    UpdateSavingsGoalCommand,
)
from src.domain.entities.savings_goal import SavingsGoal
from src.domain.exceptions import SavingsGoalNotFoundError
from src.domain.ports.repositories import SavingsGoalRepository
from src.domain.value_objects import SavingsGoalId, UserId


def _to_result(goal: SavingsGoal) -> SavingsGoalResult:
    return SavingsGoalResult(
        id=str(goal.id.value),
        user_id=str(goal.user_id.value),
        name=goal.name,
        target_amount=goal.target_amount,
        current_amount=goal.current_amount,
        deadline=goal.deadline,
        progress_ratio=goal.progress_ratio,
        remaining_amount=goal.remaining_amount,
        created_at=goal.created_at,
    )


class CreateSavingsGoal:
    def __init__(self, goals: SavingsGoalRepository) -> None:
        self._goals = goals

    async def execute(self, cmd: CreateSavingsGoalCommand) -> SavingsGoalResult:
        goal = SavingsGoal.create(
            user_id=UserId.from_string(cmd.user_id),
            name=cmd.name,
            target_amount=cmd.target_amount,
            current_amount=cmd.current_amount,
            deadline=cmd.deadline,
        )
        await self._goals.save(goal)
        return _to_result(goal)


class UpdateSavingsGoal:
    def __init__(self, goals: SavingsGoalRepository) -> None:
        self._goals = goals

    async def execute(self, cmd: UpdateSavingsGoalCommand) -> SavingsGoalResult:
        user_id = UserId.from_string(cmd.user_id)
        goal = await self._goals.get_by_id_for_user(
            SavingsGoalId.from_string(cmd.goal_id), user_id
        )
        if goal is None:
            raise SavingsGoalNotFoundError("Savings goal not found")
        goal.name = cmd.name
        goal.target_amount = cmd.target_amount
        goal.current_amount = cmd.current_amount
        goal.deadline = cmd.deadline
        await self._goals.save(goal)
        return _to_result(goal)


class DeleteSavingsGoal:
    def __init__(self, goals: SavingsGoalRepository) -> None:
        self._goals = goals

    async def execute(self, cmd: DeleteSavingsGoalCommand) -> None:
        await self._goals.delete(
            SavingsGoalId.from_string(cmd.goal_id),
            UserId.from_string(cmd.user_id),
        )


class ListSavingsGoals:
    def __init__(self, goals: SavingsGoalRepository) -> None:
        self._goals = goals

    async def execute(self, query: ListSavingsGoalsQuery) -> list[SavingsGoalResult]:
        goals = await self._goals.list_by_user(UserId.from_string(query.user_id))
        return [_to_result(g) for g in goals]
