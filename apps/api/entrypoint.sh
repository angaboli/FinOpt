#!/bin/bash
set -e

echo "🚀 Starting Finopt API initialization..."

# Function to wait for database using Python (more reliable for Neon)
wait_for_db() {
    echo "⏳ Waiting for database to be ready..."

    max_attempts=30
    attempt=0

    until python3 -c "
import asyncio
import sys
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_connection():
    try:
        engine = create_async_engine(os.environ['DATABASE_URL'], echo=False)
        async with engine.connect() as conn:
            await conn.execute(text('SELECT 1'))
        await engine.dispose()
        return True
    except Exception as e:
        return False

result = asyncio.run(check_connection())
sys.exit(0 if result else 1)
" || [ $attempt -eq $max_attempts ]; do
        attempt=$((attempt+1))
        echo "⏳ Attempt $attempt/$max_attempts - Database not ready yet..."
        sleep 2
    done

    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Database connection timeout after $max_attempts attempts"
        echo "❌ Please verify your DATABASE_URL in .env file"
        exit 1
    fi

    echo "✅ Database is ready!"
}

# Function to check if schema is already applied
is_schema_applied() {
    python3 -c "
import asyncio
import sys
from sqlalchemy import text
from src.infrastructure.database.connection import engine

async def check():
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text(\"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'\"))
            count = result.scalar()
            await engine.dispose()
            return count > 0
    except Exception as e:
        print(f'Error checking schema: {e}', file=sys.stderr)
        await engine.dispose()
        return False

result = asyncio.run(check())
sys.exit(0 if result else 1)
"
}

# Function to apply schema
apply_schema() {
    echo "📊 Applying database schema..."

    if python3 /app/apply_schema.py; then
        echo "✅ Schema applied successfully!"
        return 0
    else
        echo "❌ Failed to apply schema"
        return 1
    fi
}

# Main initialization logic
main() {
    # Wait for database to be ready
    wait_for_db

    # Check if schema needs to be applied
    echo "🔍 Checking if database schema is already applied..."

    if is_schema_applied; then
        echo "✅ Database schema already exists, skipping initialization"
    else
        echo "📝 Database schema not found, applying schema..."
        if ! apply_schema; then
            echo "❌ Failed to initialize database"
            exit 1
        fi
    fi

    echo "🎉 Database initialization complete!"
    echo "🚀 Starting application: $@"

    # Execute the command passed as arguments
    exec "$@"
}

# Run main function with all script arguments
main "$@"
