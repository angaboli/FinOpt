from __future__ import annotations

from datetime import UTC, datetime, timedelta

from src.application.auth.dtos import (
    AuthTokensResult,
    LoginCommand,
    LogoutCommand,
    RefreshSessionCommand,
    SignUpCommand,
    UserResult,
)
from src.domain.entities.refresh_token import RefreshToken
from src.domain.entities.user import User
from src.domain.exceptions import (
    DuplicateEmailError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    UserNotFoundError,
)
from src.domain.ports.auth import PasswordHasher, RefreshTokenGenerator, TokenIssuer
from src.domain.ports.repositories import RefreshTokenRepository, UserRepository
from src.domain.value_objects import Email, UserId


def to_user_result(user: User) -> UserResult:
    return UserResult(id=str(user.id.value), email=user.email.value, name=user.name)


def refresh_token_hash(raw_token: str) -> str:
    return f"hash:{raw_token}"


class SignUpUser:
    def __init__(self, users: UserRepository, password_hasher: PasswordHasher) -> None:
        self._users = users
        self._password_hasher = password_hasher

    async def execute(self, command: SignUpCommand) -> UserResult:
        email = Email(command.email)
        if await self._users.get_by_email(email):
            raise DuplicateEmailError(email.value)
        user = User.create(email=email, password_hash=self._password_hasher.hash(command.password), name=command.name)
        await self._users.save(user)
        return to_user_result(user)


class LoginUser:
    def __init__(
        self,
        users: UserRepository,
        refresh_tokens: RefreshTokenRepository,
        password_hasher: PasswordHasher,
        token_issuer: TokenIssuer,
        refresh_token_generator: RefreshTokenGenerator,
        refresh_token_ttl: timedelta,
    ) -> None:
        self._users = users
        self._refresh_tokens = refresh_tokens
        self._password_hasher = password_hasher
        self._token_issuer = token_issuer
        self._refresh_token_generator = refresh_token_generator
        self._refresh_token_ttl = refresh_token_ttl

    async def execute(self, command: LoginCommand) -> AuthTokensResult:
        user = await self._users.get_by_email(Email(command.email))
        if user is None or not self._password_hasher.verify(command.password, user.password_hash):
            raise InvalidCredentialsError()
        raw_refresh_token, token_hash = self._refresh_token_generator.generate()
        refresh_token = RefreshToken.create(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.now(UTC) + self._refresh_token_ttl,
        )
        await self._refresh_tokens.save(refresh_token)
        return AuthTokensResult(
            user=to_user_result(user),
            access_token=self._token_issuer.create_access_token(user),
            refresh_token=raw_refresh_token,
        )


class RefreshSession:
    def __init__(
        self,
        users: UserRepository,
        refresh_tokens: RefreshTokenRepository,
        token_issuer: TokenIssuer,
    ) -> None:
        self._users = users
        self._refresh_tokens = refresh_tokens
        self._token_issuer = token_issuer

    async def execute(self, command: RefreshSessionCommand) -> AuthTokensResult:
        token = await self._refresh_tokens.get_by_hash(refresh_token_hash(command.refresh_token))
        if token is None:
            raise InvalidRefreshTokenError("Refresh token not found")
        token.ensure_usable()
        user = await self._users.get_by_id(token.user_id)
        if user is None:
            raise UserNotFoundError("Refresh token user does not exist")
        return AuthTokensResult(
            user=to_user_result(user),
            access_token=self._token_issuer.create_access_token(user),
            refresh_token=command.refresh_token,
        )


class LogoutSession:
    def __init__(self, refresh_tokens: RefreshTokenRepository) -> None:
        self._refresh_tokens = refresh_tokens

    async def execute(self, command: LogoutCommand) -> None:
        token = await self._refresh_tokens.get_by_hash(refresh_token_hash(command.refresh_token))
        if token is not None:
            await self._refresh_tokens.revoke(token.id)


class GetCurrentUser:
    def __init__(self, users: UserRepository) -> None:
        self._users = users

    async def execute(self, user_id: str) -> UserResult:
        user = await self._users.get_by_id(UserId.from_string(user_id))
        if user is None:
            raise UserNotFoundError("User not found")
        return to_user_result(user)
