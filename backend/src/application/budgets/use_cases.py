from __future__ import annotations

from decimal import Decimal

from src.application.budgets.dtos import (
    BudgetLineResult,
    BudgetResult,
    GetBudgetQuery,
    SetBudgetCommand,
)
from src.domain.entities.budget import Budget, BudgetLine
from src.domain.ports.repositories import BudgetRepository
from src.domain.value_objects import BudgetId, CategoryId, UserId


def _to_result(budget: Budget) -> BudgetResult:
    return BudgetResult(
        id=str(budget.id.value),
        user_id=str(budget.user_id.value),
        year=budget.year,
        month=budget.month,
        lines=[
            BudgetLineResult(
                category_id=str(line.category_id.value),
                planned_amount=line.planned_amount,
            )
            for line in budget.lines
        ],
        total_planned=budget.total_planned,
    )


class SetBudget:
    def __init__(self, budgets: BudgetRepository) -> None:
        self._budgets = budgets

    async def execute(self, cmd: SetBudgetCommand) -> BudgetResult:
        user_id = UserId.from_string(cmd.user_id)
        lines = [
            BudgetLine(
                category_id=CategoryId.from_string(line.category_id),
                planned_amount=line.planned_amount,
            )
            for line in cmd.lines
        ]

        existing = await self._budgets.get_by_month(user_id, cmd.year, cmd.month)
        if existing:
            existing.update(lines)
            await self._budgets.save(existing)
            return _to_result(existing)

        budget = Budget.create(user_id=user_id, year=cmd.year, month=cmd.month, lines=lines)
        await self._budgets.save(budget)
        return _to_result(budget)


class GetBudget:
    def __init__(self, budgets: BudgetRepository) -> None:
        self._budgets = budgets

    async def execute(self, query: GetBudgetQuery) -> BudgetResult | None:
        user_id = UserId.from_string(query.user_id)
        budget = await self._budgets.get_by_month(user_id, query.year, query.month)
        return _to_result(budget) if budget else None
