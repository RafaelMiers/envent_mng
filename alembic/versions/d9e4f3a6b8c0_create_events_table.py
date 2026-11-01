"""create events table

Revision ID: d9e4f3a6b8c0
Revises: c8d3e2f5a7b9
Create Date: 2026-11-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d9e4f3a6b8c0"
down_revision: Union[str, Sequence[str], None] = "c8d3e2f5a7b9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organizer_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("location", sa.String(length=250), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "starts_at < ends_at",
            name="ck_events_valid_time_range",
        ),
        sa.ForeignKeyConstraint(
            ["organizer_id"],
            ["organizers.id"],
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_events_organizer_id", "events", ["organizer_id"])


def downgrade() -> None:
    op.drop_index("ix_events_organizer_id", table_name="events")
    op.drop_table("events")
