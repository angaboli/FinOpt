"""Test database connection."""
import asyncio
import sys
from src.infrastructure.database.connection import engine, get_async_database_url
from sqlalchemy import text
from src.config import settings

async def test_connection():
    """Test database connection."""
    try:
        print(f"Testing connection to database...")
        db_url = get_async_database_url(settings.database_url)
        print(f"Database URL pattern: {db_url[:50]}...")

        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            row = result.fetchone()
            print(f"✓ Database connection successful: {row}")

            # Test if users table exists
            result = await conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_name = 'users'
                )
            """))
            exists = result.fetchone()[0]
            if exists:
                print("✓ Users table exists")
            else:
                print("✗ Users table does not exist - run migrations first")

        await engine.dispose()
        return True

    except Exception as e:
        print(f"✗ Database connection failed: {type(e).__name__}: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_connection())
    sys.exit(0 if success else 1)
