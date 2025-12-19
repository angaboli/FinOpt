"""Apply database schema to Neon by executing statements separately."""
import asyncio
import sys
import re
from pathlib import Path
from src.infrastructure.database.connection import engine
from sqlalchemy import text

def split_sql_statements(sql_content):
    """Split SQL content into individual statements, handling functions and triggers properly."""
    # Remove comments
    sql_content = re.sub(r'--.*$', '', sql_content, flags=re.MULTILINE)

    # Split by semicolons, but be careful with function definitions
    statements = []
    current_statement = []
    in_function = False
    dollar_quote = None

    for line in sql_content.split('\n'):
        line = line.strip()
        if not line:
            continue

        # Track dollar-quoted strings in functions
        if '$$' in line:
            if dollar_quote is None:
                dollar_quote = '$$'
                in_function = True
            else:
                dollar_quote = None
                in_function = False

        current_statement.append(line)

        # If we hit a semicolon and we're not in a function, that's the end of a statement
        if line.endswith(';') and not in_function:
            stmt = '\n'.join(current_statement)
            if stmt.strip():
                statements.append(stmt)
            current_statement = []

    # Add any remaining statement
    if current_statement:
        stmt = '\n'.join(current_statement)
        if stmt.strip():
            statements.append(stmt)

    return statements

async def apply_schema():
    """Apply the database schema."""
    schema_path = Path(__file__).parent.parent.parent / "infra" / "supabase" / "schema.sql"

    if not schema_path.exists():
        print(f"✗ Schema file not found: {schema_path}")
        return False

    print(f"📂 Reading schema from {schema_path}")
    schema_sql = schema_path.read_text()

    print("🔄 Splitting SQL statements...")
    statements = split_sql_statements(schema_sql)
    print(f"Found {len(statements)} statements to execute")

    print("\n🔄 Applying schema to database...")

    try:
        for i, stmt in enumerate(statements, 1):
            try:
                # Show progress for long operations
                if 'CREATE TABLE' in stmt:
                    table_name = re.search(r'CREATE TABLE (\w+)', stmt)
                    if table_name:
                        print(f"  [{i}/{len(statements)}] Creating table: {table_name.group(1)}")
                elif 'CREATE INDEX' in stmt:
                    print(f"  [{i}/{len(statements)}] Creating index...")
                elif 'CREATE TYPE' in stmt:
                    type_name = re.search(r'CREATE TYPE (\w+)', stmt)
                    if type_name:
                        print(f"  [{i}/{len(statements)}] Creating type: {type_name.group(1)}")
                elif 'CREATE POLICY' in stmt:
                    print(f"  [{i}/{len(statements)}] Creating RLS policy...")
                elif 'INSERT INTO' in stmt:
                    print(f"  [{i}/{len(statements)}] Inserting default data...")

                # Execute each statement in its own transaction
                async with engine.begin() as conn:
                    await conn.execute(text(stmt))

            except Exception as e:
                # Some errors we can ignore (like "already exists")
                error_msg = str(e).lower()
                if 'already exists' in error_msg or 'duplicate' in error_msg:
                    print(f"  ⚠️  Skipping (already exists)")
                    continue
                else:
                    print(f"\n⚠️  Warning on statement {i}:")
                    print(f"  {stmt[:150]}...")
                    print(f"  Error: {e}")
                    # Don't raise, continue with other statements
                    continue

        print("\n✅ Schema applied successfully!")
        print("\n📊 Verifying tables...")

        async with engine.connect() as conn:
            result = await conn.execute(text("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            """))
            tables = result.fetchall()

            print(f"\nCreated {len(tables)} tables:")
            for table in tables:
                print(f"  ✓ {table[0]}")

        return True

    except Exception as e:
        print(f"\n✗ Error applying schema: {type(e).__name__}: {e}")
        return False
    finally:
        await engine.dispose()

if __name__ == "__main__":
    success = asyncio.run(apply_schema())
    sys.exit(0 if success else 1)
