from __future__ import annotations

import json
import re
from datetime import date as DateType
from decimal import Decimal, InvalidOperation

import openai

from src.application.receipts.dtos import (
    ListReceiptsQuery,
    ReceiptItemDto,
    ReceiptItemResult,
    ReceiptResult,
    SaveReceiptCommand,
    ScanReceiptCommand,
    ScanReceiptResult,
)
from src.domain.entities.receipt import Receipt, ReceiptItem
from src.domain.exceptions import InvalidReceiptError
from src.domain.ports.repositories import ReceiptRepository
from src.domain.value_objects import UserId
from src.infrastructure.settings import Settings

_OCR_PROMPT = (
    "You are a receipt OCR assistant. Extract all information from this receipt image.\n"
    "Respond ONLY with a JSON object (no markdown, no explanation) matching this schema:\n"
    '{"merchant": string|null, "date": "YYYY-MM-DD"|null, "total": number|null, '
    '"items": [{"name": string, "amount": number}]}\n'
    "Use null for fields you cannot determine. amounts are positive numbers."
)


def _parse_ocr_response(text: str) -> ScanReceiptResult:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    raw = match.group(0) if match else text
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise InvalidReceiptError(f"OCR response parse error: {exc}") from exc

    merchant = data.get("merchant") or None
    total_raw = data.get("total")
    try:
        total = Decimal(str(total_raw)) if total_raw is not None else None
    except InvalidOperation:
        total = None

    date_str = data.get("date")
    date: DateType | None = None
    if date_str:
        try:
            date = DateType.fromisoformat(str(date_str))
        except ValueError:
            date = None

    items: list[ReceiptItemDto] = []
    for item in data.get("items", []):
        try:
            items.append(
                ReceiptItemDto(name=str(item["name"]), amount=Decimal(str(item["amount"])))
            )
        except (KeyError, InvalidOperation):
            continue

    return ScanReceiptResult(merchant=merchant, total=total, date=date, items=items)


def _to_result(receipt: Receipt) -> ReceiptResult:
    return ReceiptResult(
        id=str(receipt.id.value),
        user_id=str(receipt.user_id.value),
        merchant=receipt.merchant,
        total=receipt.total,
        date=receipt.date,
        items=[ReceiptItemResult(name=i.name, amount=i.amount, category_id=i.category_id) for i in receipt.items],
        transaction_id=receipt.transaction_id,
        created_at=receipt.created_at,
    )


class ScanReceipt:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def execute(self, cmd: ScanReceiptCommand) -> ScanReceiptResult:
        if not self._settings.openai_api_key:
            raise InvalidReceiptError("OpenAI API key not configured")

        client = openai.OpenAI(api_key=self._settings.openai_api_key)
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{cmd.media_type};base64,{cmd.image_base64}",
                            },
                        },
                        {"type": "text", "text": _OCR_PROMPT},
                    ],
                }
            ],
        )
        response_text = response.choices[0].message.content or ""
        return _parse_ocr_response(response_text)


class SaveReceipt:
    def __init__(self, receipts: ReceiptRepository) -> None:
        self._receipts = receipts

    async def execute(self, cmd: SaveReceiptCommand) -> ReceiptResult:
        user_id = UserId.from_string(cmd.user_id)
        receipt = Receipt.create(
            user_id=user_id,
            merchant=cmd.merchant,
            total=cmd.total,
            date=cmd.date,
            items=[ReceiptItem(name=item.name, amount=item.amount, category_id=item.category_id) for item in cmd.items],
            transaction_id=cmd.transaction_id,
        )
        await self._receipts.save(receipt)
        return _to_result(receipt)


class ListReceipts:
    def __init__(self, receipts: ReceiptRepository) -> None:
        self._receipts = receipts

    async def execute(self, query: ListReceiptsQuery) -> list[ReceiptResult]:
        items = await self._receipts.list_by_user(UserId.from_string(query.user_id))
        return [_to_result(r) for r in items]
