"""Add Google external identities.

Revision ID: 20260721_07
Revises: 20260718_06
Create Date: 2026-07-21
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op


revision = "20260721_07"
down_revision = "20260718_06"
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
        "external_identities",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "provider",
            sa.String(length=32),
            nullable=False,
        ),
        sa.Column(
            "subject",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "display_name",
            sa.String(length=160),
            nullable=True,
        ),
        sa.Column(
            "avatar_url",
            sa.String(length=1024),
            nullable=True,
        ),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "provider",
            "subject",
            name="uq_external_identity_provider_subject",
        ),
        sa.UniqueConstraint(
            "user_id",
            "provider",
            name="uq_external_identity_user_provider",
        ),
    )

    op.create_index(
        "ix_external_identities_user_id",
        "external_identities",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "ix_external_identities_provider",
        "external_identities",
        ["provider"],
        unique=False,
    )
    op.create_index(
        "ix_external_identities_subject",
        "external_identities",
        ["subject"],
        unique=False,
    )
    op.create_index(
        "ix_external_identities_email",
        "external_identities",
        ["email"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_external_identities_email",
        table_name="external_identities",
    )
    op.drop_index(
        "ix_external_identities_subject",
        table_name="external_identities",
    )
    op.drop_index(
        "ix_external_identities_provider",
        table_name="external_identities",
    )
    op.drop_index(
        "ix_external_identities_user_id",
        table_name="external_identities",
    )
    op.drop_table("external_identities")
