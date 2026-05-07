from __future__ import annotations

import base64
import io
import json
import re
from datetime import date as DateType
from decimal import Decimal, InvalidOperation

import openai
import pypdf

from src.application.bank_imports.dtos import (
    BankImportResult,
    ImportBankStatementCommand,
    ListBankImportsQuery,
    ParsePdfCommand,
    ParsedPdfRowResult,
)
from src.domain.entities.bank_import import BankImport
from src.domain.entities.transaction import Transaction, TransactionType
from src.domain.exceptions import AccountNotFoundError, InvalidBankImportError
from src.domain.ports.repositories import (
    AccountRepository,
    BankImportRepository,
    TransactionRepository,
)
from src.domain.value_objects import AccountId, CategoryId, UserId
from src.infrastructure.settings import Settings


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


_PDF_PARSE_PROMPT = """Tu reçois le texte extrait d'un relevé bancaire PDF.
Extrais toutes les transactions et retourne uniquement un tableau JSON avec ce format exact :
[{"date":"YYYY-MM-DD","title":"libellé","amount":12.50,"type":"EXPENSE"},...]
Règles : type="INCOME" si crédit/revenu, "EXPENSE" sinon. amount toujours positif. date ISO YYYY-MM-DD.
Ne retourne rien d'autre que le JSON brut, sans markdown ni explication.
Texte du relevé :
"""


def _parse_pdf_response(text: str) -> list[ParsedPdfRowResult]:
    match = re.search(r"```(?:json)?\s*([\s\S]+?)```", text)
    raw = match.group(1) if match else text
    try:
        data = json.loads(raw.strip())
    except json.JSONDecodeError as exc:
        raise InvalidBankImportError(f"Réponse IA invalide : {exc}") from exc
    results: list[ParsedPdfRowResult] = []
    for item in data:
        try:
            parts = str(item["date"]).split("-")
            row_date = DateType(int(parts[0]), int(parts[1]), int(parts[2]))
            amount = Decimal(str(item["amount"]))
            tx_type = str(item.get("type", "EXPENSE"))
            if tx_type not in ("INCOME", "EXPENSE"):
                tx_type = "EXPENSE"
            results.append(ParsedPdfRowResult(
                date=row_date,
                title=str(item.get("title", "")).strip() or "Transaction",
                amount=amount,
                transaction_type=tx_type,
            ))
        except (KeyError, ValueError, InvalidOperation):
            continue
    return results


class ParsePdfStatement:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def execute(self, cmd: ParsePdfCommand) -> list[ParsedPdfRowResult]:
        if not self._settings.openai_api_key:
            raise InvalidBankImportError("OpenAI API key not configured")
        try:
            pdf_bytes = base64.b64decode(cmd.file_base64)
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise InvalidBankImportError(f"Lecture PDF impossible : {exc}") from exc
        if not text.strip():
            raise InvalidBankImportError("Impossible d'extraire le texte du PDF.")
        client = openai.OpenAI(api_key=self._settings.openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=4096,
            messages=[{"role": "user", "content": _PDF_PARSE_PROMPT + text[:12000]}],
        )
        response_text = response.choices[0].message.content or ""
        return _parse_pdf_response(response_text)


class ListBankImports:
    def __init__(self, bank_imports: BankImportRepository) -> None:
        self._bank_imports = bank_imports

    async def execute(self, query: ListBankImportsQuery) -> list[BankImportResult]:
        items = await self._bank_imports.list_by_user(UserId.from_string(query.user_id))
        return [_to_result(bi) for bi in items]
