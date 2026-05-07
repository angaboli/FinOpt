"""create receipts and receipt_items tables

Revision ID: 202605070007
Revises: 202605070006
Create Date: 2026-05-07
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "202605070007"
down_revision: str | None = "202605070006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "receipts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("merchant", sa.String(200), nullable=True),
        sa.Column("total", sa.Numeric(14, 2), nullable=True),
        sa.Column("date", sa.Date(), nullable=True),
        sa.Column("transaction_id", sa.String(36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_receipts_user_id"), "receipts", ["user_id"], unique=False)
    op.create_table(
        "receipt_items",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("receipt_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("amount", sa.Numeric(14, 2), nullable=False),
        sa.ForeignKeyConstraint(["receipt_id"], ["receipts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_receipt_items_receipt_id"), "receipt_items", ["receipt_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_receipt_items_receipt_id"), table_name="receipt_items")
    op.drop_table("receipt_items")
    op.drop_index(op.f("ix_receipts_user_id"), table_name="receipts")
    op.drop_table("receipts")
