"""Initial scheduling schema.

Revision ID: 20260716_01
Revises:
Create Date: 2026-07-16
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260716_01"
down_revision: str | None = None
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
        "customers",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=120),
            nullable=False,
        ),
        sa.Column(
            "email",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "phone",
            sa.String(length=32),
            nullable=False,
        ),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_customers_email",
        "customers",
        ["email"],
        unique=False,
    )

    op.create_index(
        "ix_customers_phone",
        "customers",
        ["phone"],
        unique=False,
    )

    op.create_table(
        "barbers",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=120),
            nullable=False,
        ),
        sa.Column(
            "slug",
            sa.String(length=120),
            nullable=False,
        ),
        sa.Column(
            "active",
            sa.Boolean(),
            nullable=False,
        ),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_barbers_slug",
        "barbers",
        ["slug"],
        unique=True,
    )

    op.create_table(
        "services",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=120),
            nullable=False,
        ),
        sa.Column(
            "slug",
            sa.String(length=120),
            nullable=False,
        ),
        sa.Column(
            "duration_minutes",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "price_cents",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "active",
            sa.Boolean(),
            nullable=False,
        ),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_services_slug",
        "services",
        ["slug"],
        unique=True,
    )

    op.create_table(
        "appointments",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "customer_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "barber_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "service_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "starts_at",
            sa.DateTime(timezone=True),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(length=24),
            nullable=False,
        ),
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
        *timestamp_columns(),
        sa.ForeignKeyConstraint(
            ["barber_id"],
            ["barbers.id"],
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers.id"],
        ),
        sa.ForeignKeyConstraint(
            ["service_id"],
            ["services.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    for column in (
        "barber_id",
        "customer_id",
        "service_id",
        "starts_at",
        "status",
    ):
        op.create_index(
            f"ix_appointments_{column}",
            "appointments",
            [column],
            unique=False,
        )


def downgrade() -> None:
    for column in (
        "status",
        "starts_at",
        "service_id",
        "customer_id",
        "barber_id",
    ):
        op.drop_index(
            f"ix_appointments_{column}",
            table_name="appointments",
        )

    op.drop_table("appointments")

    op.drop_index(
        "ix_services_slug",
        table_name="services",
    )
    op.drop_table("services")

    op.drop_index(
        "ix_barbers_slug",
        table_name="barbers",
    )
    op.drop_table("barbers")

    op.drop_index(
        "ix_customers_phone",
        table_name="customers",
    )
    op.drop_index(
        "ix_customers_email",
        table_name="customers",
    )
    op.drop_table("customers")
