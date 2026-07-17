"""Add barber schedules and blocks.

Revision ID: 20260716_02
Revises: 20260716_01
Create Date: 2026-07-16
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260716_02"
down_revision: str | None = "20260716_01"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def timestamp_columns() -> list[sa.Column]:
    return [
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "CURRENT_TIMESTAMP"
            ),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "CURRENT_TIMESTAMP"
            ),
            nullable=False,
        ),
    ]


def upgrade() -> None:
    op.create_table(
        "barber_schedules",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "barber_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "weekday",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "start_time",
            sa.Time(),
            nullable=False,
        ),
        sa.Column(
            "end_time",
            sa.Time(),
            nullable=False,
        ),
        sa.Column(
            "active",
            sa.Boolean(),
            nullable=False,
        ),
        *timestamp_columns(),
        sa.CheckConstraint(
            "weekday >= 0 AND weekday <= 6",
            name="ck_barber_schedules_weekday",
        ),
        sa.CheckConstraint(
            "end_time > start_time",
            name="ck_barber_schedules_time_order",
        ),
        sa.ForeignKeyConstraint(
            ["barber_id"],
            ["barbers.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "barber_id",
            "weekday",
            "start_time",
            "end_time",
            name="uq_barber_schedule_window",
        ),
    )

    op.create_index(
        "ix_barber_schedules_barber_id",
        "barber_schedules",
        ["barber_id"],
        unique=False,
    )

    op.create_index(
        "ix_barber_schedules_weekday",
        "barber_schedules",
        ["weekday"],
        unique=False,
    )

    op.create_table(
        "barber_blocks",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "barber_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "starts_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "ends_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "reason",
            sa.String(length=255),
            nullable=True,
        ),
        *timestamp_columns(),
        sa.CheckConstraint(
            "ends_at > starts_at",
            name="ck_barber_blocks_time_order",
        ),
        sa.ForeignKeyConstraint(
            ["barber_id"],
            ["barbers.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_barber_blocks_barber_id",
        "barber_blocks",
        ["barber_id"],
        unique=False,
    )

    op.create_index(
        "ix_barber_blocks_starts_at",
        "barber_blocks",
        ["starts_at"],
        unique=False,
    )

    op.create_index(
        "ix_barber_blocks_ends_at",
        "barber_blocks",
        ["ends_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_barber_blocks_ends_at",
        table_name="barber_blocks",
    )
    op.drop_index(
        "ix_barber_blocks_starts_at",
        table_name="barber_blocks",
    )
    op.drop_index(
        "ix_barber_blocks_barber_id",
        table_name="barber_blocks",
    )
    op.drop_table("barber_blocks")

    op.drop_index(
        "ix_barber_schedules_weekday",
        table_name="barber_schedules",
    )
    op.drop_index(
        "ix_barber_schedules_barber_id",
        table_name="barber_schedules",
    )
    op.drop_table("barber_schedules")
