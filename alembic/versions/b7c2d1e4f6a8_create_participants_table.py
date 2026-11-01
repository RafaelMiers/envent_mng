"""create participants table

Revision ID: b7c2d1e4f6a8
Revises: a5d89c41b3ef
Create Date: 2026-11-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b7c2d1e4f6a8"
down_revision: Union[str, Sequence[str], None] = "a5d89c41b3ef"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "participants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("cpf", sa.String(length=11), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=True),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.CheckConstraint(
            "email IS NOT NULL OR phone IS NOT NULL",
            name="ck_participants_contact_required",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cpf", name="uq_participants_cpf"),
    )


def downgrade() -> None:
    op.drop_table("participants")
