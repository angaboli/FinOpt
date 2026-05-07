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
    await client.post("/auth/signup", json={"email": "budget-user@test.com", "password": "strongpassword"})
    login = await client.post("/auth/login", json={"email": "budget-user@test.com", "password": "strongpassword"})
    token = login.json()["access_token"]
    # create a category to use in budget lines
    cat = await client.post("/categories", headers={"Authorization": f"Bearer {token}"}, json={"name": "Alimentation", "color": "#006D36"})
    return client, token, cat.json()["id"]


@pytest.mark.asyncio
async def test_budget_set_and_get() -> None:
    client, token, cat_id = await _authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}
    try:
        # GET before any budget → null
        get_empty = await client.get("/budgets", headers=headers, params={"year": 2026, "month": 5})
        assert get_empty.status_code == 200
        assert get_empty.json() is None

        # PUT creates budget
        put = await client.put(
            "/budgets",
            headers=headers,
            json={"year": 2026, "month": 5, "lines": [{"category_id": cat_id, "planned_amount": "500.00"}]},
        )
        assert put.status_code == 200
        budget = put.json()
        assert budget["year"] == 2026
        assert budget["month"] == 5
        assert len(budget["lines"]) == 1
        assert budget["total_planned"] == "500.00"

        # GET returns the budget
        get = await client.get("/budgets", headers=headers, params={"year": 2026, "month": 5})
        assert get.status_code == 200
        assert get.json()["total_planned"] == "500.00"

        # PUT with updated lines (upsert)
        put2 = await client.put(
            "/budgets",
            headers=headers,
            json={"year": 2026, "month": 5, "lines": [{"category_id": cat_id, "planned_amount": "800.00"}]},
        )
        assert put2.status_code == 200
        assert put2.json()["total_planned"] == "800.00"
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_budget_requires_authentication() -> None:
    async with AsyncClient(transport=ASGITransport(app=create_app()), base_url="http://test") as client:
        response = await client.get("/budgets", params={"year": 2026, "month": 5})
    assert response.status_code == 401
