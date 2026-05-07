from datetime import UTC, datetime, timedelta

import pytest

from src.application.auth.dtos import (
    LoginCommand,
    LogoutCommand,
    RefreshSessionCommand,
    SignUpCommand,
)
from src.application.auth.use_cases import LoginUser, LogoutSession, RefreshSession, SignUpUser
from src.domain.entities.refresh_token import RefreshToken
from src.domain.entities.user import User
from src.domain.exceptions import (
    DuplicateEmailError,
    InvalidCredentialsError,
    RevokedRefreshTokenError,
)
from src.domain.ports.auth import PasswordHasher, RefreshTokenGenerator, TokenIssuer
from src.domain.ports.repositories import RefreshTokenRepository, UserRepository
from src.domain.value_objects import Email, RefreshTokenId


class InMemoryUserRepository(UserRepository):
    def __init__(self) -> None:
        self.users: dict[str, User] = {}

    async def get_by_email(self, email: Email) -> User | None:
        return self.users.get(email.value)

    async def get_by_id(self, user_id):
        return next((user for user in self.users.values() if user.id == user_id), None)

    async def save(self, user: User) -> None:
        if user.email.value in self.users:
            raise DuplicateEmailError(user.email.value)
        self.users[user.email.value] = user


class InMemoryRefreshTokenRepository(RefreshTokenRepository):
    def __init__(self) -> None:
        self.tokens: dict[str, RefreshToken] = {}

    async def save(self, refresh_token: RefreshToken) -> None:
        self.tokens[refresh_token.token_hash] = refresh_token

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        return self.tokens.get(token_hash)

    async def revoke(self, token_id: RefreshTokenId) -> None:
        for token in self.tokens.values():
            if token.id == token_id:
                token.revoke()


class FakePasswordHasher(PasswordHasher):
    def hash(self, plain_password: str) -> str:
        return f"hashed:{plain_password}"

    def verify(self, plain_password: str, password_hash: str) -> bool:
        return password_hash == self.hash(plain_password)


class FakeTokenIssuer(TokenIssuer):
    def create_access_token(self, user: User) -> str:
        return f"access:{user.id.value}"


class FakeRefreshTokenGenerator(RefreshTokenGenerator):
    def generate(self) -> tuple[str, str]:
        return ("refresh-token", "hashed-refresh-token")


@pytest.mark.asyncio
async def test_signup_creates_user() -> None:
    users = InMemoryUserRepository()
    result = await SignUpUser(users, FakePasswordHasher()).execute(
        SignUpCommand(email="person@example.com", password="correct horse battery")
    )

    assert result.email == "person@example.com"
    assert users.users["person@example.com"].password_hash == "hashed:correct horse battery"


@pytest.mark.asyncio
async def test_signup_rejects_duplicate_email() -> None:
    users = InMemoryUserRepository()
    use_case = SignUpUser(users, FakePasswordHasher())
    await use_case.execute(SignUpCommand(email="person@example.com", password="password-1"))

    with pytest.raises(DuplicateEmailError):
        await use_case.execute(SignUpCommand(email="PERSON@example.com", password="password-2"))


@pytest.mark.asyncio
async def test_login_returns_tokens() -> None:
    users = InMemoryUserRepository()
    sessions = InMemoryRefreshTokenRepository()
    user = await SignUpUser(users, FakePasswordHasher()).execute(
        SignUpCommand(email="person@example.com", password="secret-123")
    )

    result = await LoginUser(
        users,
        sessions,
        FakePasswordHasher(),
        FakeTokenIssuer(),
        FakeRefreshTokenGenerator(),
        refresh_token_ttl=timedelta(days=30),
    ).execute(LoginCommand(email="person@example.com", password="secret-123"))

    assert result.user.id == user.id
    assert result.access_token == f"access:{user.id}"
    assert result.refresh_token == "refresh-token"
    assert str(sessions.tokens["hashed-refresh-token"].user_id.value) == user.id


@pytest.mark.asyncio
async def test_login_rejects_bad_password() -> None:
    users = InMemoryUserRepository()
    await SignUpUser(users, FakePasswordHasher()).execute(
        SignUpCommand(email="person@example.com", password="secret-123")
    )

    with pytest.raises(InvalidCredentialsError):
        await LoginUser(
            users,
            InMemoryRefreshTokenRepository(),
            FakePasswordHasher(),
            FakeTokenIssuer(),
            FakeRefreshTokenGenerator(),
            refresh_token_ttl=timedelta(days=30),
        ).execute(LoginCommand(email="person@example.com", password="wrong"))


@pytest.mark.asyncio
async def test_refresh_rejects_revoked_token() -> None:
    users = InMemoryUserRepository()
    sessions = InMemoryRefreshTokenRepository()
    created = User.create(Email("person@example.com"), "hash")
    await users.save(created)
    token = RefreshToken.create(
        user_id=created.id,
        token_hash="hash:revoked",
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    token.revoke()
    await sessions.save(token)

    with pytest.raises(RevokedRefreshTokenError):
        await RefreshSession(users, sessions, FakeTokenIssuer()).execute(
            RefreshSessionCommand(refresh_token="revoked")
        )


@pytest.mark.asyncio
async def test_logout_revokes_refresh_token() -> None:
    users = InMemoryUserRepository()
    sessions = InMemoryRefreshTokenRepository()
    user = User.create(Email("person@example.com"), "hash")
    await users.save(user)
    token = RefreshToken.create(
        user_id=user.id,
        token_hash="hash:refresh-token",
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )
    await sessions.save(token)

    await LogoutSession(sessions).execute(LogoutCommand(refresh_token="refresh-token"))

    assert token.is_revoked is True
