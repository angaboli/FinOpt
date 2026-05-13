"""add is_subscription to transactions

Revision ID: 202605080011
Revises: 202605070010
Create Date: 2026-05-08
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "202605080011"
down_revision = "202605070010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "transactions",
        sa.Column("is_subscription", sa.Boolean(), nullable=False, server_default="false"),
    )


def downgrade() -> None:
    op.drop_column("transactions", "is_subscription")
