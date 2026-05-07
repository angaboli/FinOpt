from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from src.domain.exceptions import InvalidUserError
from src.domain.value_objects import Email, UserId


@dataclass
class User:
    id: UserId
    email: Email
    password_hash: str
    created_at: datetime
    name: str = ""

    @classmethod
    def create(cls, email: Email, password_hash: str, name: str = "") -> User:
        return cls(
            id=UserId.new(),
            email=email,
            password_hash=password_hash,
            created_at=datetime.now(UTC),
            name=name.strip(),
        )

    def __post_init__(self) -> None:
        if not self.password_hash:
            raise InvalidUserError("Password hash is required")
        if self.created_at.tzinfo is None:
            raise InvalidUserError("Created timestamp must be timezone-aware")
