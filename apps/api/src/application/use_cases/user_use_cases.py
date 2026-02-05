"""User management use cases."""

from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


@dataclass
class UpdateUserUseCase:
    """Update user profile (full_name, email)."""
    db: AsyncSession

    async def execute(self, user_id: str, full_name: str | None = None, email: str | None = None) -> dict:
        # Build dynamic update
        fields = []
        params: dict = {"user_id": user_id}

        if full_name is not None:
            fields.append("full_name = :full_name")
            params["full_name"] = full_name
        if email is not None:
            # Check email uniqueness
            result = await self.db.execute(
                text("SELECT id FROM users WHERE email = :email AND id != :user_id"),
                {"email": email, "user_id": user_id},
            )
            if result.fetchone():
                raise ValueError("Email already in use")
            fields.append("email = :email")
            params["email"] = email

        if not fields:
            raise ValueError("No fields to update")

        fields.append("updated_at = NOW()")
        query = f"UPDATE users SET {', '.join(fields)} WHERE id = :user_id RETURNING id, email, full_name, created_at"
        result = await self.db.execute(text(query), params)
        row = result.fetchone()
        if not row:
            raise ValueError("User not found")
        await self.db.commit()

        return {
            "id": str(row.id),
            "email": row.email,
            "full_name": row.full_name,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }


@dataclass
class ChangePasswordUseCase:
    """Change user password after verifying current password."""
    db: AsyncSession

    async def execute(self, user_id: str, current_password: str, new_password: str) -> None:
        result = await self.db.execute(
            text("SELECT password_hash FROM users WHERE id = :user_id"),
            {"user_id": user_id},
        )
        row = result.fetchone()
        if not row:
            raise ValueError("User not found")

        if not pwd_context.verify(current_password, row.password_hash):
            raise ValueError("Current password is incorrect")

        if len(new_password) < 8:
            raise ValueError("New password must be at least 8 characters")

        new_hash = pwd_context.hash(new_password)
        await self.db.execute(
            text("UPDATE users SET password_hash = :hash, updated_at = NOW() WHERE id = :user_id"),
            {"hash": new_hash, "user_id": user_id},
        )
        await self.db.commit()


@dataclass
class DeleteUserUseCase:
    """Delete user and all associated data (cascade)."""
    db: AsyncSession

    async def execute(self, user_id: str, password: str) -> None:
        # Verify password
        result = await self.db.execute(
            text("SELECT password_hash FROM users WHERE id = :user_id"),
            {"user_id": user_id},
        )
        row = result.fetchone()
        if not row:
            raise ValueError("User not found")

        if not pwd_context.verify(password, row.password_hash):
            raise ValueError("Incorrect password")

        # Delete in dependency order
        for table in [
            "notification_preferences",
            "notifications",
            "budget_events",
            "budgets",
            "insights",
            "goals",
            "transactions",
            "import_history",
            "accounts",
            "users",
        ]:
            await self.db.execute(
                text(f"DELETE FROM {table} WHERE {'user_id' if table != 'users' else 'id'} = :user_id"),
                {"user_id": user_id},
            )
        await self.db.commit()
