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
        json={"email": "income-owner@example.com", "password": "strong-password"},
    )
    login = await client.post(
        "/auth/login",
        json={"email": "income-owner@example.com", "password": "strong-password"},
    )
    return client, login.json()["access_token"]


@pytest.mark.asyncio
async def test_income_source_crud_flow() -> None:
    client, token = await authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}

    try:
        created = await client.post(
            "/income-sources",
            headers=headers,
            json={"name": "Salaire", "amount": "3200.00", "frequency": "MONTHLY"},
        )
        assert created.status_code == 201
        source = created.json()
        assert source["name"] == "Salaire"
        assert source["amount"] == "3200.00"
        assert source["frequency"] == "MONTHLY"

        listed = await client.get("/income-sources", headers=headers)
        assert listed.status_code == 200
        assert len(listed.json()) == 1
        assert listed.json()[0]["name"] == "Salaire"

        updated = await client.put(
            f"/income-sources/{source['id']}",
            headers=headers,
            json={"name": "Freelance", "amount": "1500.00", "frequency": "QUARTERLY"},
        )
        assert updated.status_code == 200
        assert updated.json()["name"] == "Freelance"
        assert updated.json()["frequency"] == "QUARTERLY"

        deleted = await client.delete(f"/income-sources/{source['id']}", headers=headers)
        assert deleted.status_code == 204

        listed_after = await client.get("/income-sources", headers=headers)
        assert listed_after.json() == []
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_income_sources_require_authentication() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/income-sources")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_unknown_income_source_returns_404() -> None:
    client, token = await authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}

    try:
        response = await client.put(
            "/income-sources/00000000-0000-0000-0000-000000000000",
            headers=headers,
            json={"name": "Salaire", "amount": "100.00", "frequency": "MONTHLY"},
        )
        assert response.status_code == 404
    finally:
        await client.aclose()
