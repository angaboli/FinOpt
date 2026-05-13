"""add usage to categories

Revision ID: 202605130012
Revises: 202605080011
Create Date: 2026-05-13 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "202605130012"
down_revision = "202605080011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "categories",
        sa.Column("usage", sa.String(16), nullable=False, server_default="EXPENSE"),
    )


def downgrade() -> None:
    op.drop_column("categories", "usage")
