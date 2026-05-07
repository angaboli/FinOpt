from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.domain.exceptions import (
    AccountNotFoundError,
    BankImportNotFoundError,
    BudgetNotFoundError,
    CategoryNotFoundError,
    DomainError,
    DuplicateEmailError,
    ExpiredRefreshTokenError,
    IncomeSourceNotFoundError,
    InvalidCredentialsError,
    InvalidRefreshTokenError,
    ReceiptNotFoundError,
    RevokedRefreshTokenError,
    SavingsGoalNotFoundError,
    TransactionNotFoundError,
    UserNotFoundError,
)
from src.infrastructure.database import Base, engine
from src.infrastructure.logging_config import configure_logging
from src.infrastructure.settings import get_settings
from src.presentation.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from src.presentation.routes import router


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(title="FinOpt API", version="0.1.0", lifespan=lifespan)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)

    @app.get("/health", tags=["ops"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "version": "0.1.0"}

    @app.exception_handler(DomainError)
    async def domain_error_handler(_request: Request, exc: DomainError) -> JSONResponse:
        if isinstance(exc, DuplicateEmailError):
            code = status.HTTP_409_CONFLICT
        elif isinstance(
            exc,
            (
                InvalidCredentialsError,
                InvalidRefreshTokenError,
                ExpiredRefreshTokenError,
                RevokedRefreshTokenError,
            ),
        ):
            code = status.HTTP_401_UNAUTHORIZED
        elif isinstance(
            exc,
            (
                UserNotFoundError,
                AccountNotFoundError,
                IncomeSourceNotFoundError,
                CategoryNotFoundError,
                TransactionNotFoundError,
                BudgetNotFoundError,
                BankImportNotFoundError,
                ReceiptNotFoundError,
                SavingsGoalNotFoundError,
            ),
        ):
            code = status.HTTP_404_NOT_FOUND
        else:
            code = status.HTTP_400_BAD_REQUEST
        return JSONResponse(status_code=code, content={"detail": str(exc)})

    return app


app = create_app()
