from src.application.income_sources.dtos import (
    CreateIncomeSourceCommand,
    DeleteIncomeSourceCommand,
    IncomeSourceResult,
    ListIncomeSourcesQuery,
    UpdateIncomeSourceCommand,
)
from src.domain.entities.income_source import Frequency, IncomeSource
from src.domain.exceptions import IncomeSourceNotFoundError
from src.domain.ports.repositories import IncomeSourceRepository
from src.domain.value_objects import IncomeSourceId, UserId


def to_income_source_result(source: IncomeSource) -> IncomeSourceResult:
    return IncomeSourceResult(
        id=str(source.id.value),
        user_id=str(source.user_id.value),
        name=source.name,
        amount=source.amount,
        frequency=source.frequency.value,
    )


class CreateIncomeSource:
    def __init__(self, sources: IncomeSourceRepository) -> None:
        self._sources = sources

    async def execute(self, command: CreateIncomeSourceCommand) -> IncomeSourceResult:
        source = IncomeSource.create(
            user_id=UserId.from_string(command.user_id),
            name=command.name,
            amount=command.amount,
            frequency=Frequency(command.frequency),
        )
        await self._sources.save(source)
        return to_income_source_result(source)


class ListIncomeSources:
    def __init__(self, sources: IncomeSourceRepository) -> None:
        self._sources = sources

    async def execute(self, query: ListIncomeSourcesQuery) -> list[IncomeSourceResult]:
        sources = await self._sources.list_by_user(UserId.from_string(query.user_id))
        return [to_income_source_result(s) for s in sources]


class UpdateIncomeSource:
    def __init__(self, sources: IncomeSourceRepository) -> None:
        self._sources = sources

    async def execute(self, command: UpdateIncomeSourceCommand) -> IncomeSourceResult:
        user_id = UserId.from_string(command.user_id)
        source = await self._sources.get_by_id_for_user(
            IncomeSourceId.from_string(command.source_id), user_id
        )
        if source is None:
            raise IncomeSourceNotFoundError("Income source not found")
        source.update(
            name=command.name,
            amount=command.amount,
            frequency=Frequency(command.frequency),
        )
        await self._sources.save(source)
        return to_income_source_result(source)


class DeleteIncomeSource:
    def __init__(self, sources: IncomeSourceRepository) -> None:
        self._sources = sources

    async def execute(self, command: DeleteIncomeSourceCommand) -> None:
        user_id = UserId.from_string(command.user_id)
        source_id = IncomeSourceId.from_string(command.source_id)
        source = await self._sources.get_by_id_for_user(source_id, user_id)
        if source is None:
            raise IncomeSourceNotFoundError("Income source not found")
        await self._sources.delete(source_id, user_id)
