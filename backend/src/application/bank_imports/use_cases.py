from __future__ import annotations

from src.application.bank_imports.dtos import (
    BankImportResult,
    ImportBankStatementCommand,
    ListBankImportsQuery,
)
from src.application.transactions.use_cases import to_transaction_result
from src.domain.entities.bank_import import BankImport
from src.domain.entities.transaction import Transaction, TransactionType
from src.domain.exceptions import AccountNotFoundError
from src.domain.ports.repositories import (
    AccountRepository,
    BankImportRepository,
    TransactionRepository,
)
from src.domain.value_objects import AccountId, CategoryId, UserId


def _to_result(bi: BankImport) -> BankImportResult:
    return BankImportResult(
        id=str(bi.id.value),
        user_id=str(bi.user_id.value),
        account_id=str(bi.account_id.value),
        source_name=bi.source_name,
        row_count=bi.row_count,
        imported_count=bi.imported_count,
        created_at=bi.created_at,
    )


class ImportBankStatement:
    def __init__(
        self,
        bank_imports: BankImportRepository,
        transactions: TransactionRepository,
        accounts: AccountRepository,
    ) -> None:
        self._bank_imports = bank_imports
        self._transactions = transactions
        self._accounts = accounts

    async def execute(self, cmd: ImportBankStatementCommand) -> BankImportResult:
        user_id = UserId.from_string(cmd.user_id)
        account_id = AccountId.from_string(cmd.account_id)

        account = await self._accounts.get_by_id_for_user(account_id, user_id)
        if account is None:
            raise AccountNotFoundError("Account not found")

        imported = 0
        for row in cmd.rows:
            tx = Transaction.create(
                user_id=user_id,
                account_id=account_id,
                category_id=CategoryId.from_string(row.category_id),
                title=row.title,
                amount=row.amount,
                transaction_type=TransactionType(row.transaction_type),
                date=row.date,
                note=None,
            )
            account.balance += tx.balance_delta
            await self._transactions.save(tx)
            imported += 1

        await self._accounts.save(account)

        bank_import = BankImport.create(
            user_id=user_id,
            account_id=account_id,
            source_name=cmd.source_name,
            row_count=len(cmd.rows),
            imported_count=imported,
        )
        await self._bank_imports.save(bank_import)
        return _to_result(bank_import)


class ListBankImports:
    def __init__(self, bank_imports: BankImportRepository) -> None:
        self._bank_imports = bank_imports

    async def execute(self, query: ListBankImportsQuery) -> list[BankImportResult]:
        items = await self._bank_imports.list_by_user(UserId.from_string(query.user_id))
        return [_to_result(bi) for bi in items]
