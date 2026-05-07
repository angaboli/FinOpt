from dataclasses import dataclass


@dataclass(frozen=True)
class SignUpCommand:
    email: str
    password: str
    name: str = ""


@dataclass(frozen=True)
class LoginCommand:
    email: str
    password: str


@dataclass(frozen=True)
class RefreshSessionCommand:
    refresh_token: str


@dataclass(frozen=True)
class LogoutCommand:
    refresh_token: str


@dataclass(frozen=True)
class UserResult:
    id: str
    email: str
    name: str = ""


@dataclass(frozen=True)
class AuthTokensResult:
    user: UserResult
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
