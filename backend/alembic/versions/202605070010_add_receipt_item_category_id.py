"""add category_id to receipt_items

Revision ID: 202605070010
Revises: 202605070009
Create Date: 2026-05-07
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "202605070010"
down_revision = "202605070009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("receipt_items", sa.Column("category_id", sa.String(36), nullable=True))


def downgrade() -> None:
    op.drop_column("receipt_items", "category_id")
