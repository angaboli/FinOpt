"""Apply database schema to Neon."""
import asyncio
import sys
from pathlib import Path
from src.infrastructure.database.connection import engine
from sqlalchemy import text

async def apply_schema():
    """Apply the database schema."""
    schema_path = Path(__file__).parent.parent.parent / "infra" / "supabase" / "schema.sql"

    if not schema_path.exists():
        print(f"✗ Schema file not found: {schema_path}")
        return False

    print(f"📂 Reading schema from {schema_path}")
    schema_sql = schema_path.read_text()

    print("🔄 Applying schema to database...")

    try:
        async with engine.begin() as conn:
            # Execute the schema
            await conn.execute(text(schema_sql))

        print("✅ Schema applied successfully!")
        print("\n📊 Verifying tables...")

        async with engine.connect() as conn:
            result = await conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """))
            tables = result.fetchall()

            print(f"\nCreated {len(tables)} tables:")
            for table in tables:
                print(f"  ✓ {table[0]}")

        return True

    except Exception as e:
        print(f"✗ Error applying schema: {type(e).__name__}: {e}")
        return False
    finally:
        await engine.dispose()

if __name__ == "__main__":
    success = asyncio.run(apply_schema())
    sys.exit(0 if success else 1)
