"""add user name

Revision ID: 202605070009
Revises: 202605070008
Create Date: 2026-05-07

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "202605070009"
down_revision = "202605070008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("name", sa.String(120), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("users", "name")
