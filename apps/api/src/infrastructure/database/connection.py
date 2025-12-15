"""Database connection management with Supabase."""

from supabase import create_client, Client
from src.config import settings


class Database:
    """Database connection manager."""

    _client: Client = None

    @classmethod
    def get_client(cls) -> Client:
        """Get Supabase client instance."""
        if cls._client is None:
            cls._client = create_client(
                supabase_url=settings.supabase_url,
                supabase_key=settings.supabase_key,
            )
        return cls._client

    @classmethod
    def get_service_client(cls) -> Client:
        """Get Supabase client with service role (bypasses RLS)."""
        return create_client(
            supabase_url=settings.supabase_url,
            supabase_key=settings.supabase_service_role_key,
        )


def get_db() -> Client:
    """Dependency for getting database client."""
    return Database.get_client()
