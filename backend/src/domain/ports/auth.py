from __future__ import annotations

from typing import Protocol

from src.domain.entities.user import User


class PasswordHasher(Protocol):
    def hash(self, plain_password: str) -> str: ...

    def verify(self, plain_password: str, password_hash: str) -> bool: ...


class TokenIssuer(Protocol):
    def create_access_token(self, user: User) -> str: ...


class RefreshTokenGenerator(Protocol):
    def generate(self) -> tuple[str, str]: ...
