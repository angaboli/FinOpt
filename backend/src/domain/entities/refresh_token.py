from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from src.domain.exceptions import ExpiredRefreshTokenError, RevokedRefreshTokenError
from src.domain.value_objects import RefreshTokenId, UserId


@dataclass
class RefreshToken:
    id: RefreshTokenId
    user_id: UserId
    token_hash: str
    expires_at: datetime
    revoked_at: datetime | None = None

    @classmethod
    def create(cls, user_id: UserId, token_hash: str, expires_at: datetime) -> RefreshToken:
        return cls(
            id=RefreshTokenId.new(),
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None

    def revoke(self) -> None:
        if self.revoked_at is None:
            self.revoked_at = datetime.now(UTC)

    def ensure_usable(self, now: datetime | None = None) -> None:
        reference = now or datetime.now(UTC)
        if self.is_revoked:
            raise RevokedRefreshTokenError("Refresh token was revoked")
        if self.expires_at <= reference:
            raise ExpiredRefreshTokenError("Refresh token expired")
