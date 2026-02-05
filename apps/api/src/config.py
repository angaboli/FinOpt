from pydantic_settings import BaseSettings
from pydantic import model_validator
from functools import lru_cache
from typing import Optional, List


class Settings(BaseSettings):
    """Application settings."""

    # Application
    app_name: str = "Finopt"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = True

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True

    # CORS
    cors_origins: str = "*"

    # Database (Neon)
    database_url: str
    neon_project_id: Optional[str] = None

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Celery
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"

    # AI/LLM
    anthropic_api_key: str
    anthropic_model: str = "claude-3-5-sonnet-20241022"

    # JWT
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30

    # Notifications
    expo_access_token: Optional[str] = None

    # File upload
    max_upload_size: int = 10485760  # 10MB

    # Logging
    log_level: str = "INFO"
    log_format: str = "json"

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def cors_origin_list(self) -> List[str]:
        if self.cors_origins == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @model_validator(mode="after")
    def enforce_production_safety(self):
        if self.environment == "production":
            object.__setattr__(self, "debug", False)
            object.__setattr__(self, "api_reload", False)
        return self

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Export settings instance
settings = get_settings()
