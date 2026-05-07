from decimal import Decimal

import pytest

from src.application.income_sources.dtos import (
    CreateIncomeSourceCommand,
    DeleteIncomeSourceCommand,
    ListIncomeSourcesQuery,
    UpdateIncomeSourceCommand,
)
from src.application.income_sources.use_cases import (
    CreateIncomeSource,
    DeleteIncomeSource,
    ListIncomeSources,
    UpdateIncomeSource,
)
from src.domain.entities.income_source import Frequency, IncomeSource
from src.domain.exceptions import IncomeSourceNotFoundError
from src.domain.ports.repositories import IncomeSourceRepository
from src.domain.value_objects import IncomeSourceId, UserId


class InMemoryIncomeSourceRepository(IncomeSourceRepository):
    def __init__(self) -> None:
        self.sources: dict[str, IncomeSource] = {}

    async def save(self, source: IncomeSource) -> None:
        self.sources[str(source.id.value)] = source

    async def list_by_user(self, user_id: UserId) -> list[IncomeSource]:
        return [s for s in self.sources.values() if s.user_id == user_id]

    async def get_by_id_for_user(
        self, source_id: IncomeSourceId, user_id: UserId
    ) -> IncomeSource | None:
        source = self.sources.get(str(source_id.value))
        if source is None or source.user_id != user_id:
            return None
        return source

    async def delete(self, source_id: IncomeSourceId, user_id: UserId) -> None:
        source = await self.get_by_id_for_user(source_id, user_id)
        if source:
            del self.sources[str(source.id.value)]


@pytest.mark.asyncio
async def test_create_income_source_saves_and_returns_result() -> None:
    repo = InMemoryIncomeSourceRepository()
    user_id = str(UserId.new().value)

    result = await CreateIncomeSource(repo).execute(
        CreateIncomeSourceCommand(
            user_id=user_id,
            name="Salaire",
            amount=Decimal("3200.00"),
            frequency="MONTHLY",
        )
    )

    assert result.name == "Salaire"
    assert result.amount == Decimal("3200.00")
    assert result.frequency == "MONTHLY"
    assert result.user_id == user_id
    assert len(repo.sources) == 1


@pytest.mark.asyncio
async def test_list_income_sources_returns_only_user_sources() -> None:
    repo = InMemoryIncomeSourceRepository()
    user_a = str(UserId.new().value)
    user_b = str(UserId.new().value)
    create = CreateIncomeSource(repo)
    await create.execute(CreateIncomeSourceCommand(user_a, "Salaire", Decimal("3200"), "MONTHLY"))
    await create.execute(CreateIncomeSourceCommand(user_b, "Freelance", Decimal("1000"), "ONCE"))

    results = await ListIncomeSources(repo).execute(ListIncomeSourcesQuery(user_id=user_a))

    assert len(results) == 1
    assert results[0].name == "Salaire"


@pytest.mark.asyncio
async def test_update_income_source_changes_fields() -> None:
    repo = InMemoryIncomeSourceRepository()
    user_id = str(UserId.new().value)
    created = await CreateIncomeSource(repo).execute(
        CreateIncomeSourceCommand(user_id, "Salaire", Decimal("3200"), "MONTHLY")
    )

    updated = await UpdateIncomeSource(repo).execute(
        UpdateIncomeSourceCommand(
            user_id=user_id,
            source_id=created.id,
            name="Freelance",
            amount=Decimal("1500"),
            frequency="QUARTERLY",
        )
    )

    assert updated.name == "Freelance"
    assert updated.amount == Decimal("1500")
    assert updated.frequency == "QUARTERLY"


@pytest.mark.asyncio
async def test_update_income_source_raises_when_not_found() -> None:
    repo = InMemoryIncomeSourceRepository()

    with pytest.raises(IncomeSourceNotFoundError):
        await UpdateIncomeSource(repo).execute(
            UpdateIncomeSourceCommand(
                user_id=str(UserId.new().value),
                source_id=str(IncomeSourceId.new().value),
                name="Salaire",
                amount=Decimal("100"),
                frequency="MONTHLY",
            )
        )


@pytest.mark.asyncio
async def test_delete_income_source_removes_it() -> None:
    repo = InMemoryIncomeSourceRepository()
    user_id = str(UserId.new().value)
    created = await CreateIncomeSource(repo).execute(
        CreateIncomeSourceCommand(user_id, "Salaire", Decimal("3200"), "MONTHLY")
    )

    await DeleteIncomeSource(repo).execute(
        DeleteIncomeSourceCommand(user_id=user_id, source_id=created.id)
    )

    assert len(await repo.list_by_user(UserId.from_string(user_id))) == 0


@pytest.mark.asyncio
async def test_delete_income_source_raises_when_not_found() -> None:
    repo = InMemoryIncomeSourceRepository()

    with pytest.raises(IncomeSourceNotFoundError):
        await DeleteIncomeSource(repo).execute(
            DeleteIncomeSourceCommand(
                user_id=str(UserId.new().value),
                source_id=str(IncomeSourceId.new().value),
            )
        )
