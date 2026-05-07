from src.application.accounts.dtos import (
    AccountResult,
    CreateAccountCommand,
    DeleteAccountCommand,
    ListAccountsQuery,
    UpdateAccountCommand,
)
from src.domain.entities.account import Account, AccountType
from src.domain.exceptions import AccountNotFoundError
from src.domain.ports.repositories import AccountRepository
from src.domain.value_objects import AccountId, UserId


def to_account_result(account: Account) -> AccountResult:
    return AccountResult(
        id=str(account.id.value),
        user_id=str(account.user_id.value),
        name=account.name,
        account_type=account.account_type.value,
        balance=account.balance,
        currency=account.currency,
        color=account.color,
    )


class CreateAccount:
    def __init__(self, accounts: AccountRepository) -> None:
        self._accounts = accounts

    async def execute(self, command: CreateAccountCommand) -> AccountResult:
        account = Account.create(
            user_id=UserId.from_string(command.user_id),
            name=command.name,
            account_type=AccountType(command.account_type),
            balance=command.balance,
            currency=command.currency,
            color=command.color,
        )
        await self._accounts.save(account)
        return to_account_result(account)


class ListAccounts:
    def __init__(self, accounts: AccountRepository) -> None:
        self._accounts = accounts

    async def execute(self, query: ListAccountsQuery) -> list[AccountResult]:
        accounts = await self._accounts.list_by_user(UserId.from_string(query.user_id))
        return [to_account_result(account) for account in accounts]


class UpdateAccount:
    def __init__(self, accounts: AccountRepository) -> None:
        self._accounts = accounts

    async def execute(self, command: UpdateAccountCommand) -> AccountResult:
        user_id = UserId.from_string(command.user_id)
        account = await self._accounts.get_by_id_for_user(
            AccountId.from_string(command.account_id),
            user_id,
        )
        if account is None:
            raise AccountNotFoundError("Account not found")
        account.update(
            name=command.name,
            account_type=AccountType(command.account_type),
            balance=command.balance,
            currency=command.currency,
            color=command.color,
        )
        await self._accounts.save(account)
        return to_account_result(account)


class DeleteAccount:
    def __init__(self, accounts: AccountRepository) -> None:
        self._accounts = accounts

    async def execute(self, command: DeleteAccountCommand) -> None:
        user_id = UserId.from_string(command.user_id)
        account_id = AccountId.from_string(command.account_id)
        account = await self._accounts.get_by_id_for_user(account_id, user_id)
        if account is None:
            raise AccountNotFoundError("Account not found")
        await self._accounts.delete(account_id, user_id)
