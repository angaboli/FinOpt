import pytest
from httpx import ASGITransport, AsyncClient

from src.infrastructure.database import Base, async_session_maker, engine
from src.presentation.main import create_app


@pytest.fixture(autouse=True)
async def reset_database() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)


@pytest.mark.asyncio
async def test_signup_login_me_refresh_logout_flow() -> None:
    app = create_app()
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        signup = await client.post(
            "/auth/signup",
            json={"email": "USER@example.com", "password": "strong-password"},
        )
        assert signup.status_code == 201
        assert signup.json()["email"] == "user@example.com"

        duplicate = await client.post(
            "/auth/signup",
            json={"email": "user@example.com", "password": "strong-password"},
        )
        assert duplicate.status_code == 409

        login = await client.post(
            "/auth/login",
            json={"email": "user@example.com", "password": "strong-password"},
        )
        assert login.status_code == 200
        tokens = login.json()
        assert tokens["token_type"] == "bearer"
        assert tokens["access_token"]
        assert tokens["refresh_token"]

        me = await client.get(
            "/users/me",
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        assert me.status_code == 200
        assert me.json()["email"] == "user@example.com"

        refreshed = await client.post(
            "/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert refreshed.status_code == 200
        assert refreshed.json()["access_token"]

        logout = await client.post(
            "/auth/logout",
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert logout.status_code == 204

        revoked = await client.post(
            "/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )
        assert revoked.status_code == 401

    await async_session_maker().close()
