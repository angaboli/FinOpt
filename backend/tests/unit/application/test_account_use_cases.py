from decimal import Decimal

import pytest

from src.application.accounts.dtos import (
    CreateAccountCommand,
    DeleteAccountCommand,
    ListAccountsQuery,
    UpdateAccountCommand,
)
from src.application.accounts.use_cases import (
    CreateAccount,
    DeleteAccount,
    ListAccounts,
    UpdateAccount,
)
from src.domain.entities.account import Account
from src.domain.exceptions import AccountNotFoundError
from src.domain.ports.repositories import AccountRepository
from src.domain.value_objects import AccountId, UserId


class InMemoryAccountRepository(AccountRepository):
    def __init__(self) -> None:
        self.accounts: dict[str, Account] = {}

    async def save(self, account: Account) -> None:
        self.accounts[str(account.id.value)] = account

    async def list_by_user(self, user_id: UserId) -> list[Account]:
        return [account for account in self.accounts.values() if account.user_id == user_id]

    async def get_by_id_for_user(self, account_id: AccountId, user_id: UserId) -> Account | None:
        account = self.accounts.get(str(account_id.value))
        if account is None or account.user_id != user_id:
            return None
        return account

    async def delete(self, account_id: AccountId, user_id: UserId) -> None:
        account = await self.get_by_id_for_user(account_id, user_id)
        if account:
            del self.accounts[str(account.id.value)]


@pytest.mark.asyncio
async def test_create_account_saves_user_account() -> None:
    repository = InMemoryAccountRepository()
    user_id = str(UserId.new().value)

    result = await CreateAccount(repository).execute(
        CreateAccountCommand(
            user_id=user_id,
            name="Compte Courant",
            account_type="CURRENT",
            balance=Decimal("100.00"),
            currency="EUR",
            color="#006D36",
        )
    )

    assert result.name == "Compte Courant"
    assert result.user_id == user_id
    assert len(repository.accounts) == 1


@pytest.mark.asyncio
async def test_list_accounts_returns_only_user_accounts() -> None:
    repository = InMemoryAccountRepository()
    first_user = str(UserId.new().value)
    second_user = str(UserId.new().value)
    create = CreateAccount(repository)
    await create.execute(
        CreateAccountCommand(first_user, "Courant", "CURRENT", Decimal("10"), "EUR", "#006D36")
    )
    await create.execute(
        CreateAccountCommand(second_user, "Epargne", "SAVINGS", Decimal("20"), "EUR", "#76F2F8")
    )

    result = await ListAccounts(repository).execute(ListAccountsQuery(user_id=first_user))

    assert [account.name for account in result] == ["Courant"]


@pytest.mark.asyncio
async def test_update_account_changes_editable_fields() -> None:
    repository = InMemoryAccountRepository()
    user_id = str(UserId.new().value)
    account = await CreateAccount(repository).execute(
        CreateAccountCommand(user_id, "Courant", "CURRENT", Decimal("10"), "EUR", "#006D36")
    )

    updated = await UpdateAccount(repository).execute(
        UpdateAccountCommand(
            user_id=user_id,
            account_id=account.id,
            name="Compte Principal",
            account_type="JOINT",
            balance=Decimal("42.50"),
            currency="EUR",
            color="#FF9587",
        )
    )

    assert updated.name == "Compte Principal"
    assert updated.account_type == "JOINT"
    assert updated.balance == Decimal("42.50")


@pytest.mark.asyncio
async def test_update_account_rejects_missing_account() -> None:
    repository = InMemoryAccountRepository()

    with pytest.raises(AccountNotFoundError):
        await UpdateAccount(repository).execute(
            UpdateAccountCommand(
                user_id=str(UserId.new().value),
                account_id=str(AccountId.new().value),
                name="Compte",
                account_type="CURRENT",
                balance=Decimal("0"),
                currency="EUR",
                color="#006D36",
            )
        )


@pytest.mark.asyncio
async def test_delete_account_removes_account() -> None:
    repository = InMemoryAccountRepository()
    user_id = str(UserId.new().value)
    account = await CreateAccount(repository).execute(
        CreateAccountCommand(user_id, "Courant", "CURRENT", Decimal("10"), "EUR", "#006D36")
    )

    await DeleteAccount(repository).execute(
        DeleteAccountCommand(user_id=user_id, account_id=account.id)
    )

    assert await repository.list_by_user(UserId.from_string(user_id)) == []
