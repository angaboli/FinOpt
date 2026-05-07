import pytest
from httpx import ASGITransport, AsyncClient

from src.infrastructure.database import Base, engine
from src.presentation.main import create_app


@pytest.fixture(autouse=True)
async def reset_database() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)


async def authenticated_client() -> tuple[AsyncClient, str]:
    client = AsyncClient(transport=ASGITransport(app=create_app()), base_url="http://test")
    await client.post(
        "/auth/signup",
        json={"email": "category-owner@example.com", "password": "strong-password"},
    )
    login = await client.post(
        "/auth/login",
        json={"email": "category-owner@example.com", "password": "strong-password"},
    )
    return client, login.json()["access_token"]


@pytest.mark.asyncio
async def test_list_categories_seeds_defaults_for_new_user() -> None:
    client, token = await authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = await client.get("/categories", headers=headers)
        assert response.status_code == 200
        categories = response.json()
        assert len(categories) >= 8
        names = [c["name"] for c in categories]
        assert "Alimentation" in names
        assert "Transport" in names
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_category_crud_flow() -> None:
    client, token = await authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}

    try:
        created = await client.post(
            "/categories",
            headers=headers,
            json={"name": "Vacances", "color": "#F59E0B"},
        )
        assert created.status_code == 201
        category = created.json()
        assert category["name"] == "Vacances"
        assert category["color"] == "#F59E0B"

        updated = await client.put(
            f"/categories/{category['id']}",
            headers=headers,
            json={"name": "Voyages", "color": "#FBBF24"},
        )
        assert updated.status_code == 200
        assert updated.json()["name"] == "Voyages"

        deleted = await client.delete(f"/categories/{category['id']}", headers=headers)
        assert deleted.status_code == 204
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_categories_require_authentication() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/categories")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_unknown_category_returns_404() -> None:
    client, token = await authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = await client.put(
            "/categories/00000000-0000-0000-0000-000000000000",
            headers=headers,
            json={"name": "Test", "color": "#000000"},
        )
        assert response.status_code == 404
    finally:
        await client.aclose()
