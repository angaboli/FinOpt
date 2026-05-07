from datetime import date
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.application.receipts.dtos import (
    ListReceiptsQuery,
    ReceiptItemDto,
    SaveReceiptCommand,
    ScanReceiptCommand,
)
from src.application.receipts.use_cases import ListReceipts, SaveReceipt, ScanReceipt, _parse_ocr_response
from src.domain.entities.receipt import Receipt, ReceiptItem
from src.domain.exceptions import InvalidReceiptError
from src.domain.ports.repositories import ReceiptRepository
from src.domain.value_objects import ReceiptId, UserId
from src.infrastructure.settings import Settings


class InMemoryReceiptRepository(ReceiptRepository):
    def __init__(self) -> None:
        self.receipts: dict[str, Receipt] = {}

    async def save(self, receipt: Receipt) -> None:
        self.receipts[str(receipt.id.value)] = receipt

    async def list_by_user(self, user_id: UserId) -> list[Receipt]:
        return [r for r in self.receipts.values() if r.user_id == user_id]

    async def get_by_id_for_user(self, receipt_id: ReceiptId, user_id: UserId) -> Receipt | None:
        return self.receipts.get(str(receipt_id.value))


@pytest.fixture()
def repo() -> InMemoryReceiptRepository:
    return InMemoryReceiptRepository()


@pytest.fixture()
def user_id() -> str:
    return str(UserId.new().value)


class TestSaveReceipt:
    async def test_saves_receipt(self, repo: InMemoryReceiptRepository, user_id: str) -> None:
        cmd = SaveReceiptCommand(
            user_id=user_id,
            merchant="Carrefour",
            total=Decimal("42.50"),
            date=date(2026, 5, 1),
            items=[ReceiptItemDto(name="Pain", amount=Decimal("1.50"))],
        )
        result = await SaveReceipt(repo).execute(cmd)
        assert result.merchant == "Carrefour"
        assert result.total == Decimal("42.50")
        assert len(result.items) == 1
        assert len(repo.receipts) == 1

    async def test_saves_receipt_no_items(self, repo: InMemoryReceiptRepository, user_id: str) -> None:
        cmd = SaveReceiptCommand(
            user_id=user_id,
            merchant=None,
            total=None,
            date=None,
            items=[],
        )
        result = await SaveReceipt(repo).execute(cmd)
        assert result.merchant is None
        assert result.items == []


class TestListReceipts:
    async def test_returns_empty(self, repo: InMemoryReceiptRepository, user_id: str) -> None:
        results = await ListReceipts(repo).execute(ListReceiptsQuery(user_id=user_id))
        assert results == []

    async def test_returns_saved_receipts(self, repo: InMemoryReceiptRepository, user_id: str) -> None:
        cmd = SaveReceiptCommand(
            user_id=user_id,
            merchant="Lidl",
            total=Decimal("10.00"),
            date=date(2026, 5, 6),
            items=[],
        )
        await SaveReceipt(repo).execute(cmd)
        results = await ListReceipts(repo).execute(ListReceiptsQuery(user_id=user_id))
        assert len(results) == 1
        assert results[0].merchant == "Lidl"


class TestParseOcrResponse:
    def test_parses_valid_json(self) -> None:
        text = '{"merchant": "Auchan", "date": "2026-05-01", "total": 15.5, "items": [{"name": "Beurre", "amount": 2.3}]}'
        result = _parse_ocr_response(text)
        assert result.merchant == "Auchan"
        assert result.total == Decimal("15.5")
        assert result.date == date(2026, 5, 1)
        assert len(result.items) == 1
        assert result.items[0].name == "Beurre"

    def test_parses_json_with_markdown_fence(self) -> None:
        text = 'Here is the result:\n```json\n{"merchant": null, "date": null, "total": null, "items": []}\n```'
        result = _parse_ocr_response(text)
        assert result.merchant is None
        assert result.items == []

    def test_raises_on_invalid_json(self) -> None:
        with pytest.raises(InvalidReceiptError):
            _parse_ocr_response("not json at all")


class TestScanReceipt:
    async def test_raises_without_api_key(self, user_id: str) -> None:
        settings = MagicMock(spec=Settings)
        settings.openai_api_key = ""
        with pytest.raises(InvalidReceiptError, match="OpenAI API key"):
            await ScanReceipt(settings).execute(
                ScanReceiptCommand(user_id=user_id, image_base64="abc123")
            )
