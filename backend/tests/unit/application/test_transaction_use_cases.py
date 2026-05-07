from datetime import date
from decimal import Decimal

import pytest

from src.application.transactions.dtos import (
    CreateTransactionCommand,
    DeleteTransactionCommand,
    ListTransactionsQuery,
    UpdateTransactionCommand,
)
from src.application.transactions.use_cases import (
    CreateTransaction,
    DeleteTransaction,
    ListTransactions,
    UpdateTransaction,
)
from src.domain.entities.account import Account, AccountType
from src.domain.entities.transaction import Transaction, TransactionType
from src.domain.exceptions import AccountNotFoundError, TransactionNotFoundError
from src.domain.ports.repositories import AccountRepository, TransactionRepository
from src.domain.value_objects import AccountId, CategoryId, TransactionId, UserId


class InMemoryTransactionRepository(TransactionRepository):
    def __init__(self) -> None:
        self.transactions: dict[str, Transaction] = {}

    async def save(self, transaction: Transaction) -> None:
        self.transactions[str(transaction.id.value)] = transaction

    async def list_by_user(
        self,
        user_id: UserId,
        account_id: AccountId | None,
        category_id: CategoryId | None,
        from_date: date | None,
        to_date: date | None,
        limit: int,
        offset: int,
    ) -> list[Transaction]:
        results = [t for t in self.transactions.values() if t.user_id == user_id]
        if account_id:
            results = [t for t in results if t.account_id == account_id]
        if category_id:
            results = [t for t in results if t.category_id == category_id]
        if from_date:
            results = [t for t in results if t.date >= from_date]
        if to_date:
            results = [t for t in results if t.date <= to_date]
        results.sort(key=lambda t: t.date, reverse=True)
        return results[offset : offset + limit]

    async def get_by_id_for_user(
        self, transaction_id: TransactionId, user_id: UserId
    ) -> Transaction | None:
        t = self.transactions.get(str(transaction_id.value))
        if t is None or t.user_id != user_id:
            return None
        return t

    async def delete(self, transaction_id: TransactionId, user_id: UserId) -> None:
        t = await self.get_by_id_for_user(transaction_id, user_id)
        if t:
            del self.transactions[str(transaction_id.value)]


class InMemoryAccountRepository(AccountRepository):
    def __init__(self) -> None:
        self.accounts: dict[str, Account] = {}

    async def save(self, account: Account) -> None:
        self.accounts[str(account.id.value)] = account

    async def list_by_user(self, user_id: UserId) -> list[Account]:
        return [a for a in self.accounts.values() if a.user_id == user_id]

    async def get_by_id_for_user(self, account_id: AccountId, user_id: UserId) -> Account | None:
        a = self.accounts.get(str(account_id.value))
        if a is None or a.user_id != user_id:
            return None
        return a

    async def delete(self, account_id: AccountId, user_id: UserId) -> None:
        a = await self.get_by_id_for_user(account_id, user_id)
        if a:
            del self.accounts[str(account_id.value)]


def make_account(user_id: UserId, balance: Decimal = Decimal("1000")) -> Account:
    return Account.create(
        user_id=user_id,
        name="Compte Courant",
        account_type=AccountType.CURRENT,
        balance=balance,
        currency="EUR",
        color="#006D36",
    )


@pytest.mark.asyncio
async def test_create_income_transaction_increases_balance() -> None:
    tx_repo = InMemoryTransactionRepository()
    acc_repo = InMemoryAccountRepository()
    user_id = UserId.new()
    account = make_account(user_id, Decimal("1000"))
    await acc_repo.save(account)

    result = await CreateTransaction(tx_repo, acc_repo).execute(
        CreateTransactionCommand(
            user_id=str(user_id.value),
            account_id=str(account.id.value),
            category_id=str(CategoryId.new().value),
            title="Salaire",
            amount=Decimal("3200"),
            transaction_type="INCOME",
            date=date(2026, 5, 1),
            note=None,
        )
    )

    assert result.title == "Salaire"
    assert result.transaction_type == "INCOME"
    saved_account = acc_repo.accounts[str(account.id.value)]
    assert saved_account.balance == Decimal("4200")


@pytest.mark.asyncio
async def test_create_expense_transaction_decreases_balance() -> None:
    tx_repo = InMemoryTransactionRepository()
    acc_repo = InMemoryAccountRepository()
    user_id = UserId.new()
    account = make_account(user_id, Decimal("500"))
    await acc_repo.save(account)

    await CreateTransaction(tx_repo, acc_repo).execute(
        CreateTransactionCommand(
            user_id=str(user_id.value),
            account_id=str(account.id.value),
            category_id=str(CategoryId.new().value),
            title="Courses",
            amount=Decimal("84.50"),
            transaction_type="EXPENSE",
            date=date(2026, 5, 3),
            note=None,
        )
    )

    saved_account = acc_repo.accounts[str(account.id.value)]
    assert saved_account.balance == Decimal("415.50")


@pytest.mark.asyncio
async def test_create_transaction_raises_when_account_not_found() -> None:
    tx_repo = InMemoryTransactionRepository()
    acc_repo = InMemoryAccountRepository()
    user_id = UserId.new()

    with pytest.raises(AccountNotFoundError):
        await CreateTransaction(tx_repo, acc_repo).execute(
            CreateTransactionCommand(
                user_id=str(user_id.value),
                account_id=str(AccountId.new().value),
                category_id=str(CategoryId.new().value),
                title="Test",
                amount=Decimal("100"),
                transaction_type="EXPENSE",
                date=date.today(),
                note=None,
            )
        )


@pytest.mark.asyncio
async def test_list_transactions_filters_by_account() -> None:
    tx_repo = InMemoryTransactionRepository()
    acc_repo = InMemoryAccountRepository()
    user_id = UserId.new()
    acc_a = make_account(user_id)
    acc_b = make_account(user_id)
    await acc_repo.save(acc_a)
    await acc_repo.save(acc_b)
    create = CreateTransaction(tx_repo, acc_repo)
    user_str = str(user_id.value)
    await create.execute(
        CreateTransactionCommand(
            user_str, str(acc_a.id.value), str(CategoryId.new().value),
            "Salaire", Decimal("3000"), "INCOME", date(2026, 5, 1), None,
        )
    )
    await create.execute(
        CreateTransactionCommand(
            user_str, str(acc_b.id.value), str(CategoryId.new().value),
            "Loyer", Decimal("800"), "EXPENSE", date(2026, 5, 2), None,
        )
    )

    results = await ListTransactions(tx_repo).execute(
        ListTransactionsQuery(user_id=user_str, account_id=str(acc_a.id.value))
    )

    assert len(results) == 1
    assert results[0].title == "Salaire"


@pytest.mark.asyncio
async def test_list_transactions_returns_most_recent_first() -> None:
    tx_repo = InMemoryTransactionRepository()
    acc_repo = InMemoryAccountRepository()
    user_id = UserId.new()
    account = make_account(user_id)
    await acc_repo.save(account)
    create = CreateTransaction(tx_repo, acc_repo)
    user_str = str(user_id.value)
    acc_str = str(account.id.value)
    cat_str = str(CategoryId.new().value)
    await create.execute(
        CreateTransactionCommand(user_str, acc_str, cat_str, "Old", Decimal("10"), "EXPENSE", date(2026, 4, 1), None)
    )
    await create.execute(
        CreateTransactionCommand(user_str, acc_str, cat_str, "New", Decimal("10"), "EXPENSE", date(2026, 5, 1), None)
    )

    results = await ListTransactions(tx_repo).execute(ListTransactionsQuery(user_id=user_str))

    assert results[0].title == "New"
    assert results[1].title == "Old"


@pytest.mark.asyncio
async def test_update_transaction_adjusts_balance() -> None:
    tx_repo = InMemoryTransactionRepository()
    acc_repo = InMemoryAccountRepository()
    user_id = UserId.new()
    account = make_account(user_id, Decimal("1000"))
    await acc_repo.save(account)
    user_str = str(user_id.value)
    cat_str = str(CategoryId.new().value)

    created = await CreateTransaction(tx_repo, acc_repo).execute(
        CreateTransactionCommand(
            user_str, str(account.id.value), cat_str,
            "Courses", Decimal("100"), "EXPENSE", date(2026, 5, 1), None,
        )
    )
    assert acc_repo.accounts[str(account.id.value)].balance == Decimal("900")

    await UpdateTransaction(tx_repo, acc_repo).execute(
        UpdateTransactionCommand(
            user_id=user_str,
            transaction_id=created.id,
            category_id=cat_str,
            title="Courses bio",
            amount=Decimal("150"),
            transaction_type="EXPENSE",
            date=date(2026, 5, 1),
            note=None,
        )
    )

    assert acc_repo.accounts[str(account.id.value)].balance == Decimal("850")


@pytest.mark.asyncio
async def test_delete_transaction_reverses_balance() -> None:
    tx_repo = InMemoryTransactionRepository()
    acc_repo = InMemoryAccountRepository()
    user_id = UserId.new()
    account = make_account(user_id, Decimal("1000"))
    await acc_repo.save(account)

    created = await CreateTransaction(tx_repo, acc_repo).execute(
        CreateTransactionCommand(
            str(user_id.value), str(account.id.value), str(CategoryId.new().value),
            "Netflix", Decimal("15.99"), "EXPENSE", date(2026, 5, 1), None,
        )
    )
    assert acc_repo.accounts[str(account.id.value)].balance == Decimal("984.01")

    await DeleteTransaction(tx_repo, acc_repo).execute(
        DeleteTransactionCommand(user_id=str(user_id.value), transaction_id=created.id)
    )

    assert acc_repo.accounts[str(account.id.value)].balance == Decimal("1000")
    assert len(tx_repo.transactions) == 0


@pytest.mark.asyncio
async def test_delete_transaction_raises_when_not_found() -> None:
    tx_repo = InMemoryTransactionRepository()
    acc_repo = InMemoryAccountRepository()

    with pytest.raises(TransactionNotFoundError):
        await DeleteTransaction(tx_repo, acc_repo).execute(
            DeleteTransactionCommand(
                user_id=str(UserId.new().value),
                transaction_id=str(TransactionId.new().value),
            )
        )
