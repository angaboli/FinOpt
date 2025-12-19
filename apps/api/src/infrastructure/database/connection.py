"""Database connection management with SQLAlchemy for Neon/Postgres."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from src.config import settings


# Convert DATABASE_URL to async format if needed
def get_async_database_url(url: str) -> str:
    """Convert postgres:// to postgresql+asyncpg:// and fix SSL params"""
    import re

    # Replace protocol
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

    # asyncpg uses 'ssl=require' not 'sslmode=require'
    url = url.replace("sslmode=require", "ssl=require")

    # Remove channel_binding parameter (not supported by asyncpg)
    url = re.sub(r'[&?]channel_binding=[^&]*', '', url)

    # Clean up double question marks or trailing & or ?
    url = url.replace('??', '?').rstrip('&?')

    return url


# Create async engine
engine = create_async_engine(
    get_async_database_url(settings.database_url),
    poolclass=NullPool,  # Recommended for serverless (Neon)
    echo=settings.debug,
)

# Session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncSession:
    """Dependency for getting database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
