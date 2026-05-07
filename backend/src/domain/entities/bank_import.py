from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from src.domain.value_objects import AccountId, BankImportId, UserId


@dataclass
class BankImport:
    id: BankImportId
    user_id: UserId
    account_id: AccountId
    source_name: str
    row_count: int
    imported_count: int
    created_at: datetime

    @classmethod
    def create(
        cls,
        user_id: UserId,
        account_id: AccountId,
        source_name: str,
        row_count: int,
        imported_count: int,
    ) -> BankImport:
        from datetime import UTC
        return cls(
            id=BankImportId.new(),
            user_id=user_id,
            account_id=account_id,
            source_name=source_name.strip() or "Import",
            row_count=row_count,
            imported_count=imported_count,
            created_at=datetime.now(UTC),
        )
