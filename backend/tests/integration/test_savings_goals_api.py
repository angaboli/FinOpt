import pytest
from httpx import ASGITransport, AsyncClient

from src.infrastructure.database import Base, engine
from src.presentation.main import create_app


@pytest.fixture(autouse=True)
async def reset_database() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)


async def _authenticated_client() -> tuple[AsyncClient, str]:
    client = AsyncClient(transport=ASGITransport(app=create_app()), base_url="http://test")
    await client.post("/auth/signup", json={"email": "goals-user@test.com", "password": "strongpassword"})
    login = await client.post("/auth/login", json={"email": "goals-user@test.com", "password": "strongpassword"})
    return client, login.json()["access_token"]


@pytest.mark.asyncio
async def test_savings_goal_crud_flow() -> None:
    client, token = await _authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # Empty list
        listed = await client.get("/savings-goals", headers=headers)
        assert listed.status_code == 200
        assert listed.json() == []

        # Create
        created = await client.post(
            "/savings-goals",
            headers=headers,
            json={"name": "Vacances", "target_amount": "2000.00", "current_amount": "500.00", "deadline": None},
        )
        assert created.status_code == 201
        goal = created.json()
        assert goal["name"] == "Vacances"
        assert goal["target_amount"] == "2000.00"
        assert goal["progress_ratio"] == 0.25
        assert goal["remaining_amount"] == "1500.00"

        # List returns the goal
        listed2 = await client.get("/savings-goals", headers=headers)
        assert len(listed2.json()) == 1

        # Update
        updated = await client.put(
            f"/savings-goals/{goal['id']}",
            headers=headers,
            json={"name": "Vacances été", "target_amount": "2000.00", "current_amount": "1200.00", "deadline": "2026-08-01"},
        )
        assert updated.status_code == 200
        assert updated.json()["current_amount"] == "1200.00"
        assert updated.json()["deadline"] == "2026-08-01"

        # Delete
        deleted = await client.delete(f"/savings-goals/{goal['id']}", headers=headers)
        assert deleted.status_code == 204

        # Confirm deletion
        final_list = await client.get("/savings-goals", headers=headers)
        assert final_list.json() == []
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_savings_goals_require_authentication() -> None:
    async with AsyncClient(transport=ASGITransport(app=create_app()), base_url="http://test") as client:
        response = await client.get("/savings-goals")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_health_endpoint() -> None:
    async with AsyncClient(transport=ASGITransport(app=create_app()), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
