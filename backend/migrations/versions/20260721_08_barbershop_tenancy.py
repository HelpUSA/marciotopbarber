
"""Add barbershops and memberships.

Revision ID: 20260721_08
Revises: 20260721_07
Create Date: 2026-07-21
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260721_08"
down_revision = "20260721_07"
branch_labels = None
depends_on = None


def timestamp_columns() -> tuple[sa.Column, ...]:
    return (
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )


def upgrade() -> None:
    op.create_table(
        "barbershops",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=160),
            nullable=False,
        ),
        sa.Column(
            "slug",
            sa.String(length=160),
            nullable=False,
        ),
        sa.Column(
            "document",
            sa.String(length=32),
            nullable=True,
        ),
        sa.Column(
            "email",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "phone",
            sa.String(length=32),
            nullable=True,
        ),
        sa.Column(
            "timezone",
            sa.String(length=64),
            nullable=False,
        ),
        sa.Column(
            "active",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "settings",
            sa.JSON(),
            nullable=False,
        ),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "slug",
            name="uq_barbershops_slug",
        ),
    )

    op.create_index(
        "ix_barbershops_slug",
        "barbershops",
        ["slug"],
        unique=False,
    )

    op.create_index(
        "ix_barbershops_document",
        "barbershops",
        ["document"],
        unique=False,
    )

    op.create_table(
        "barbershop_memberships",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "barbershop_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "role",
            sa.String(length=48),
            nullable=False,
        ),
        sa.Column(
            "active",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "invited_by_user_id",
            sa.Uuid(),
            nullable=True,
        ),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(
            ["barbershop_id"],
            ["barbershops.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["invited_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "barbershop_id",
            "user_id",
            name=(
                "uq_barbershop_memberships_"
                "barbershop_user"
            ),
        ),
    )

    op.create_index(
        "ix_barbershop_memberships_barbershop_id",
        "barbershop_memberships",
        ["barbershop_id"],
        unique=False,
    )

    op.create_index(
        "ix_barbershop_memberships_user_id",
        "barbershop_memberships",
        ["user_id"],
        unique=False,
    )

    op.create_index(
        "ix_barbershop_memberships_role",
        "barbershop_memberships",
        ["role"],
        unique=False,
    )

    op.create_index(
        (
            "ix_barbershop_memberships_"
            "invited_by_user_id"
        ),
        "barbershop_memberships",
        ["invited_by_user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        (
            "ix_barbershop_memberships_"
            "invited_by_user_id"
        ),
        table_name="barbershop_memberships",
    )

    op.drop_index(
        "ix_barbershop_memberships_role",
        table_name="barbershop_memberships",
    )

    op.drop_index(
        "ix_barbershop_memberships_user_id",
        table_name="barbershop_memberships",
    )

    op.drop_index(
        "ix_barbershop_memberships_barbershop_id",
        table_name="barbershop_memberships",
    )

    op.drop_table(
        "barbershop_memberships"
    )

    op.drop_index(
        "ix_barbershops_document",
        table_name="barbershops",
    )

    op.drop_index(
        "ix_barbershops_slug",
        table_name="barbershops",
    )

    op.drop_table("barbershops")
