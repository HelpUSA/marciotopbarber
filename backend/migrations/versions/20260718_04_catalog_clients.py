"""Add customer relationship and service catalog.

Revision ID: 20260718_04
Revises: 20260717_03
Create Date: 2026-07-18
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260718_04"
down_revision: str | None = "20260717_03"
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
        "service_categories",
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
            "description",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "active",
            sa.Boolean(),
            server_default=sa.text("true"),
            nullable=False,
        ),
        sa.Column(
            "position",
            sa.Integer(),
            server_default=sa.text("0"),
            nullable=False,
        ),
        *timestamp_columns(),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_service_categories_slug",
        "service_categories",
        ["slug"],
        unique=True,
    )

    op.create_index(
        "ix_service_categories_active",
        "service_categories",
        ["active"],
        unique=False,
    )

    with op.batch_alter_table(
        "customers"
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "birth_date",
                sa.Date(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "active",
                sa.Boolean(),
                server_default=sa.text("true"),
                nullable=False,
            )
        )

        batch_op.add_column(
            sa.Column(
                "notes",
                sa.Text(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "loyalty_points",
                sa.Integer(),
                server_default=sa.text("0"),
                nullable=False,
            )
        )

        batch_op.add_column(
            sa.Column(
                "last_service_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "return_due_at",
                sa.DateTime(timezone=True),
                nullable=True,
            )
        )

        batch_op.create_index(
            "ix_customers_birth_date",
            ["birth_date"],
            unique=False,
        )

        batch_op.create_index(
            "ix_customers_active",
            ["active"],
            unique=False,
        )

        batch_op.create_index(
            "ix_customers_last_service_at",
            ["last_service_at"],
            unique=False,
        )

        batch_op.create_index(
            "ix_customers_return_due_at",
            ["return_due_at"],
            unique=False,
        )

    with op.batch_alter_table(
        "services"
    ) as batch_op:
        batch_op.add_column(
            sa.Column(
                "category_id",
                sa.Uuid(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "description",
                sa.Text(),
                nullable=True,
            )
        )

        batch_op.add_column(
            sa.Column(
                "position",
                sa.Integer(),
                server_default=sa.text("0"),
                nullable=False,
            )
        )

        batch_op.create_foreign_key(
            (
                "fk_services_category_id_"
                "service_categories"
            ),
            "service_categories",
            ["category_id"],
            ["id"],
            ondelete="SET NULL",
        )

        batch_op.create_index(
            "ix_services_category_id",
            ["category_id"],
            unique=False,
        )


def downgrade() -> None:
    with op.batch_alter_table(
        "services"
    ) as batch_op:
        batch_op.drop_index(
            "ix_services_category_id"
        )

        batch_op.drop_constraint(
            (
                "fk_services_category_id_"
                "service_categories"
            ),
            type_="foreignkey",
        )

        batch_op.drop_column("position")
        batch_op.drop_column("description")
        batch_op.drop_column("category_id")

    with op.batch_alter_table(
        "customers"
    ) as batch_op:
        batch_op.drop_index(
            "ix_customers_return_due_at"
        )

        batch_op.drop_index(
            "ix_customers_last_service_at"
        )

        batch_op.drop_index(
            "ix_customers_active"
        )

        batch_op.drop_index(
            "ix_customers_birth_date"
        )

        batch_op.drop_column(
            "return_due_at"
        )

        batch_op.drop_column(
            "last_service_at"
        )

        batch_op.drop_column(
            "loyalty_points"
        )

        batch_op.drop_column("notes")
        batch_op.drop_column("active")

        batch_op.drop_column(
            "birth_date"
        )

    op.drop_index(
        "ix_service_categories_active",
        table_name="service_categories",
    )

    op.drop_index(
        "ix_service_categories_slug",
        table_name="service_categories",
    )

    op.drop_table(
        "service_categories"
    )