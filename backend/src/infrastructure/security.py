from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from src.application.auth.use_cases import refresh_token_hash
from src.domain.entities.user import User
from src.domain.ports.auth import PasswordHasher, RefreshTokenGenerator, TokenIssuer
from src.infrastructure.settings import Settings


class Argon2PasswordHasher(PasswordHasher):
    def __init__(self) -> None:
        self._hasher = PasswordHash.recommended()

    def hash(self, plain_password: str) -> str:
        return self._hasher.hash(plain_password)

    def verify(self, plain_password: str, password_hash: str) -> bool:
        return self._hasher.verify(plain_password, password_hash)


class JwtTokenIssuer(TokenIssuer):
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    def create_access_token(self, user: User) -> str:
        now = datetime.now(UTC)
        payload = {
            "sub": str(user.id.value),
            "email": user.email.value,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(minutes=self._settings.access_token_minutes)).timestamp()),
        }
        return jwt.encode(
            payload,
            self._settings.jwt_secret_key,
            algorithm=self._settings.jwt_algorithm,
        )

    def decode_subject(self, token: str) -> str:
        payload = jwt.decode(
            token,
            self._settings.jwt_secret_key,
            algorithms=[self._settings.jwt_algorithm],
        )
        return str(payload["sub"])


class SecureRefreshTokenGenerator(RefreshTokenGenerator):
    def generate(self) -> tuple[str, str]:
        raw_token = secrets.token_urlsafe(48)
        return raw_token, refresh_token_hash(raw_token)


def sha256_refresh_token_hash(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
