"""Main entry point for the API - re-exports the FastAPI app."""

from src.presentation.api.main import app

__all__ = ["app"]
