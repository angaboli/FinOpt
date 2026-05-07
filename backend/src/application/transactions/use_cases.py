from src.application.transactions.dtos import (
    CreateTransactionCommand,
    DeleteTransactionCommand,
    ListTransactionsQuery,
    TransactionResult,
    TransferCommand,
    TransferResult,
    UpdateTransactionCommand,
)
from src.domain.entities.transaction import Transaction, TransactionType
from src.domain.exceptions import AccountNotFoundError, InvalidTransferError, TransactionNotFoundError
from src.domain.ports.repositories import AccountRepository, TransactionRepository
from src.domain.value_objects import AccountId, CategoryId, TransactionId, UserId


def to_transaction_result(tx: Transaction) -> TransactionResult:
    return TransactionResult(
        id=str(tx.id.value),
        user_id=str(tx.user_id.value),
        account_id=str(tx.account_id.value),
        category_id=str(tx.category_id.value),
        title=tx.title,
        amount=tx.amount,
        transaction_type=tx.transaction_type.value,
        date=tx.date,
        note=tx.note,
    )


class CreateTransaction:
    def __init__(self, transactions: TransactionRepository, accounts: AccountRepository) -> None:
        self._transactions = transactions
        self._accounts = accounts

    async def execute(self, command: CreateTransactionCommand) -> TransactionResult:
        user_id = UserId.from_string(command.user_id)
        account = await self._accounts.get_by_id_for_user(
            AccountId.from_string(command.account_id), user_id
        )
        if account is None:
            raise AccountNotFoundError("Account not found")

        tx = Transaction.create(
            user_id=user_id,
            account_id=AccountId.from_string(command.account_id),
            category_id=CategoryId.from_string(command.category_id),
            title=command.title,
            amount=command.amount,
            transaction_type=TransactionType(command.transaction_type),
            date=command.date,
            note=command.note,
        )
        account.balance += tx.balance_delta
        await self._transactions.save(tx)
        await self._accounts.save(account)
        return to_transaction_result(tx)


class ListTransactions:
    def __init__(self, transactions: TransactionRepository) -> None:
        self._transactions = transactions

    async def execute(self, query: ListTransactionsQuery) -> list[TransactionResult]:
        txs = await self._transactions.list_by_user(
            user_id=UserId.from_string(query.user_id),
            account_id=AccountId.from_string(query.account_id) if query.account_id else None,
            category_id=CategoryId.from_string(query.category_id) if query.category_id else None,
            from_date=query.from_date,
            to_date=query.to_date,
            limit=query.limit,
            offset=query.offset,
        )
        return [to_transaction_result(tx) for tx in txs]


class UpdateTransaction:
    def __init__(self, transactions: TransactionRepository, accounts: AccountRepository) -> None:
        self._transactions = transactions
        self._accounts = accounts

    async def execute(self, command: UpdateTransactionCommand) -> TransactionResult:
        user_id = UserId.from_string(command.user_id)
        tx = await self._transactions.get_by_id_for_user(
            TransactionId.from_string(command.transaction_id), user_id
        )
        if tx is None:
            raise TransactionNotFoundError("Transaction not found")

        account = await self._accounts.get_by_id_for_user(tx.account_id, user_id)
        if account is None:
            raise AccountNotFoundError("Account not found")

        account.balance -= tx.balance_delta
        tx.update(
            category_id=CategoryId.from_string(command.category_id),
            title=command.title,
            amount=command.amount,
            transaction_type=TransactionType(command.transaction_type),
            date=command.date,
            note=command.note,
        )
        account.balance += tx.balance_delta
        await self._transactions.save(tx)
        await self._accounts.save(account)
        return to_transaction_result(tx)


class DeleteTransaction:
    def __init__(self, transactions: TransactionRepository, accounts: AccountRepository) -> None:
        self._transactions = transactions
        self._accounts = accounts

    async def execute(self, command: DeleteTransactionCommand) -> None:
        user_id = UserId.from_string(command.user_id)
        tx = await self._transactions.get_by_id_for_user(
            TransactionId.from_string(command.transaction_id), user_id
        )
        if tx is None:
            raise TransactionNotFoundError("Transaction not found")

        account = await self._accounts.get_by_id_for_user(tx.account_id, user_id)
        if account is not None:
            account.balance -= tx.balance_delta
            await self._accounts.save(account)

        await self._transactions.delete(TransactionId.from_string(command.transaction_id), user_id)


class TransferBetweenAccounts:
    def __init__(self, transactions: TransactionRepository, accounts: AccountRepository) -> None:
        self._transactions = transactions
        self._accounts = accounts

    async def execute(self, command: TransferCommand) -> TransferResult:
        user_id = UserId.from_string(command.user_id)
        from_id = AccountId.from_string(command.from_account_id)
        to_id = AccountId.from_string(command.to_account_id)

        if command.from_account_id == command.to_account_id:
            raise InvalidTransferError("Cannot transfer to the same account")

        from_account = await self._accounts.get_by_id_for_user(from_id, user_id)
        if from_account is None:
            raise AccountNotFoundError("Source account not found")

        to_account = await self._accounts.get_by_id_for_user(to_id, user_id)
        if to_account is None:
            raise AccountNotFoundError("Destination account not found")

        category_id = CategoryId.from_string(command.category_id)
        note = command.note

        debit = Transaction.create(
            user_id=user_id,
            account_id=from_id,
            category_id=category_id,
            title=f"Virement vers {to_account.name}",
            amount=command.amount,
            transaction_type=TransactionType.EXPENSE,
            date=command.date,
            note=note,
        )
        credit = Transaction.create(
            user_id=user_id,
            account_id=to_id,
            category_id=category_id,
            title=f"Virement depuis {from_account.name}",
            amount=command.amount,
            transaction_type=TransactionType.INCOME,
            date=command.date,
            note=note,
        )

        from_account.balance += debit.balance_delta
        to_account.balance += credit.balance_delta

        await self._transactions.save(debit)
        await self._transactions.save(credit)
        await self._accounts.save(from_account)
        await self._accounts.save(to_account)

        return TransferResult(
            debit_transaction_id=str(debit.id.value),
            credit_transaction_id=str(credit.id.value),
        )
