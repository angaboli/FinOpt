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
        json={"email": "account-owner@example.com", "password": "strong-password"},
    )
    login = await client.post(
        "/auth/login",
        json={"email": "account-owner@example.com", "password": "strong-password"},
    )
    return client, login.json()["access_token"]


@pytest.mark.asyncio
async def test_account_crud_flow() -> None:
    client, token = await authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}

    try:
        created = await client.post(
            "/accounts",
            headers=headers,
            json={
                "name": "Compte Courant",
                "account_type": "CURRENT",
                "balance": "1250.50",
                "currency": "EUR",
                "color": "#006D36",
            },
        )
        assert created.status_code == 201
        account = created.json()
        assert account["name"] == "Compte Courant"
        assert account["balance"] == "1250.50"

        listed = await client.get("/accounts", headers=headers)
        assert listed.status_code == 200
        assert [item["name"] for item in listed.json()] == ["Compte Courant"]

        updated = await client.put(
            f"/accounts/{account['id']}",
            headers=headers,
            json={
                "name": "Compte Principal",
                "account_type": "JOINT",
                "balance": "1400.00",
                "currency": "EUR",
                "color": "#FF9587",
            },
        )
        assert updated.status_code == 200
        assert updated.json()["name"] == "Compte Principal"
        assert updated.json()["account_type"] == "JOINT"

        deleted = await client.delete(f"/accounts/{account['id']}", headers=headers)
        assert deleted.status_code == 204

        listed_after_delete = await client.get("/accounts", headers=headers)
        assert listed_after_delete.json() == []
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_accounts_require_authentication() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()),
        base_url="http://test",
    ) as client:
        response = await client.get("/accounts")

    assert response.status_code == 401
