from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from src.application.savings_goals.dtos import (
    CreateSavingsGoalCommand,
    DeleteSavingsGoalCommand,
    ListSavingsGoalsQuery,
    UpdateSavingsGoalCommand,
)
from src.application.savings_goals.use_cases import (
    CreateSavingsGoal,
    DeleteSavingsGoal,
    ListSavingsGoals,
    UpdateSavingsGoal,
)
from src.domain.entities.savings_goal import SavingsGoal
from src.domain.exceptions import SavingsGoalNotFoundError
from src.domain.value_objects import SavingsGoalId, UserId


def _make_goal(user_id: UserId | None = None) -> SavingsGoal:
    return SavingsGoal(
        id=SavingsGoalId.new(),
        user_id=user_id or UserId.new(),
        name="Vacances",
        target_amount=Decimal("2000"),
        current_amount=Decimal("500"),
        deadline=None,
        created_at=datetime(2024, 1, 1, tzinfo=timezone.utc),
    )


@pytest.mark.asyncio
async def test_create_savings_goal_persists_and_returns():
    repo = MagicMock()
    repo.save = AsyncMock()
    user_id = str(uuid4())
    cmd = CreateSavingsGoalCommand(
        user_id=user_id,
        name="Vacances",
        target_amount=Decimal("2000"),
        current_amount=Decimal("500"),
        deadline=None,
    )
    result = await CreateSavingsGoal(repo).execute(cmd)
    repo.save.assert_awaited_once()
    assert result.name == "Vacances"
    assert result.target_amount == Decimal("2000")
    assert result.progress_ratio == pytest.approx(0.25)
    assert result.remaining_amount == Decimal("1500")


@pytest.mark.asyncio
async def test_list_savings_goals_returns_all():
    uid = UserId.new()
    goal1 = _make_goal(uid)
    goal2 = _make_goal(uid)
    repo = MagicMock()
    repo.list_by_user = AsyncMock(return_value=[goal1, goal2])
    results = await ListSavingsGoals(repo).execute(ListSavingsGoalsQuery(user_id=str(uid.value)))
    assert len(results) == 2


@pytest.mark.asyncio
async def test_update_savings_goal_updates_fields():
    uid = UserId.new()
    goal = _make_goal(uid)
    repo = MagicMock()
    repo.get_by_id_for_user = AsyncMock(return_value=goal)
    repo.save = AsyncMock()
    cmd = UpdateSavingsGoalCommand(
        user_id=str(uid.value),
        goal_id=str(goal.id.value),
        name="Voiture",
        target_amount=Decimal("10000"),
        current_amount=Decimal("3000"),
        deadline=None,
    )
    result = await UpdateSavingsGoal(repo).execute(cmd)
    assert result.name == "Voiture"
    assert result.current_amount == Decimal("3000")


@pytest.mark.asyncio
async def test_update_savings_goal_not_found_raises():
    repo = MagicMock()
    repo.get_by_id_for_user = AsyncMock(return_value=None)
    cmd = UpdateSavingsGoalCommand(
        user_id=str(uuid4()),
        goal_id=str(uuid4()),
        name="X",
        target_amount=Decimal("100"),
        current_amount=Decimal("0"),
        deadline=None,
    )
    with pytest.raises(SavingsGoalNotFoundError):
        await UpdateSavingsGoal(repo).execute(cmd)


@pytest.mark.asyncio
async def test_delete_savings_goal_delegates():
    repo = MagicMock()
    repo.delete = AsyncMock()
    user_id = str(uuid4())
    goal_id = str(uuid4())
    await DeleteSavingsGoal(repo).execute(DeleteSavingsGoalCommand(user_id=user_id, goal_id=goal_id))
    repo.delete.assert_awaited_once()
