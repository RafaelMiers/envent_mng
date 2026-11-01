"""create organizers table

Revision ID: c8d3e2f5a7b9
Revises: b7c2d1e4f6a8
Create Date: 2026-11-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8d3e2f5a7b9"
down_revision: Union[str, Sequence[str], None] = "b7c2d1e4f6a8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "organizers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_name", sa.String(length=150), nullable=False),
        sa.Column("cnpj", sa.String(length=14), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cnpj", name="uq_organizers_cnpj"),
        sa.UniqueConstraint("email", name="uq_organizers_email"),
    )


def downgrade() -> None:
    op.drop_table("organizers")
