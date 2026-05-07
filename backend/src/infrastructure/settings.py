from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="FINOPT_", env_file=".env", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///:memory:"

    @field_validator("database_url", mode="before")
    @classmethod
    def fix_postgres_scheme(cls, v: str) -> str:
        # Render provides postgresql:// but asyncpg requires postgresql+asyncpg://
        if isinstance(v, str) and v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v
    jwt_secret_key: str = Field(default="dev-secret-change-me-32-bytes-minimum", min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    environment: str = "development"
    anthropic_api_key: str = ""
    allowed_origins: list[str] = ["*"]
    log_level: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
