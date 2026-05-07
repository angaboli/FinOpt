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
        "/auth/signup", json={"email": "tx-owner@example.com", "password": "strong-password"}
    )
    login = await client.post(
        "/auth/login", json={"email": "tx-owner@example.com", "password": "strong-password"}
    )
    return client, login.json()["access_token"]


async def create_account(client: AsyncClient, headers: dict) -> dict:
    resp = await client.post(
        "/accounts",
        headers=headers,
        json={"name": "Courant", "account_type": "CURRENT", "balance": "1000.00", "currency": "EUR", "color": "#006D36"},
    )
    return resp.json()


async def create_category(client: AsyncClient, headers: dict) -> dict:
    resp = await client.post(
        "/categories",
        headers=headers,
        json={"name": "Alimentation", "color": "#22C55E"},
    )
    return resp.json()


@pytest.mark.asyncio
async def test_transaction_crud_flow() -> None:
    client, token = await authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}

    try:
        account = await create_account(client, headers)
        category = await create_category(client, headers)

        created = await client.post(
            "/transactions",
            headers=headers,
            json={
                "account_id": account["id"],
                "category_id": category["id"],
                "title": "Carrefour",
                "amount": "84.50",
                "transaction_type": "EXPENSE",
                "date": "2026-05-03",
                "note": None,
            },
        )
        assert created.status_code == 201
        tx = created.json()
        assert tx["title"] == "Carrefour"
        assert tx["transaction_type"] == "EXPENSE"

        account_after = await client.get(f"/accounts", headers=headers)
        balances = {a["id"]: a["balance"] for a in account_after.json()}
        assert balances[account["id"]] == "915.50"

        listed = await client.get("/transactions", headers=headers)
        assert listed.status_code == 200
        assert len(listed.json()) == 1

        updated = await client.put(
            f"/transactions/{tx['id']}",
            headers=headers,
            json={
                "category_id": category["id"],
                "title": "Carrefour bio",
                "amount": "120.00",
                "transaction_type": "EXPENSE",
                "date": "2026-05-03",
                "note": "drive bio",
            },
        )
        assert updated.status_code == 200
        assert updated.json()["title"] == "Carrefour bio"
        assert updated.json()["amount"] == "120.00"

        account_after_update = await client.get("/accounts", headers=headers)
        balances_after = {a["id"]: a["balance"] for a in account_after_update.json()}
        assert balances_after[account["id"]] == "880.00"

        deleted = await client.delete(f"/transactions/{tx['id']}", headers=headers)
        assert deleted.status_code == 204

        account_after_delete = await client.get("/accounts", headers=headers)
        balances_del = {a["id"]: a["balance"] for a in account_after_delete.json()}
        assert balances_del[account["id"]] == "1000.00"
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_list_transactions_filtered_by_account() -> None:
    client, token = await authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}

    try:
        acc_a = await create_account(client, headers)
        acc_b = (await client.post(
            "/accounts",
            headers=headers,
            json={"name": "Epargne", "account_type": "SAVINGS", "balance": "5000.00", "currency": "EUR", "color": "#76F2F8"},
        )).json()
        category = await create_category(client, headers)

        await client.post("/transactions", headers=headers, json={
            "account_id": acc_a["id"], "category_id": category["id"],
            "title": "Courses A", "amount": "50.00", "transaction_type": "EXPENSE",
            "date": "2026-05-01", "note": None,
        })
        await client.post("/transactions", headers=headers, json={
            "account_id": acc_b["id"], "category_id": category["id"],
            "title": "Virement B", "amount": "200.00", "transaction_type": "INCOME",
            "date": "2026-05-02", "note": None,
        })

        resp = await client.get(f"/transactions?account_id={acc_a['id']}", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) == 1
        assert resp.json()[0]["title"] == "Courses A"
    finally:
        await client.aclose()


@pytest.mark.asyncio
async def test_transactions_require_authentication() -> None:
    async with AsyncClient(
        transport=ASGITransport(app=create_app()), base_url="http://test"
    ) as client:
        assert (await client.get("/transactions")).status_code == 401


@pytest.mark.asyncio
async def test_delete_unknown_transaction_returns_404() -> None:
    client, token = await authenticated_client()
    headers = {"Authorization": f"Bearer {token}"}
    try:
        resp = await client.delete(
            "/transactions/00000000-0000-0000-0000-000000000000", headers=headers
        )
        assert resp.status_code == 404
    finally:
        await client.aclose()
