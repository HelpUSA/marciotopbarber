"""Add service orders, items and payments.

Revision ID: 20260718_06
Revises: 20260718_05
Create Date: 2026-07-18
"""

from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260718_06"
down_revision: str | None = "20260718_05"
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
        "service_orders",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "number",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "customer_id",
            sa.Uuid(),
            nullable=True,
        ),
        sa.Column(
            "appointment_id",
            sa.Uuid(),
            nullable=True,
        ),
        sa.Column(
            "opened_by_user_id",
            sa.Uuid(),
            nullable=True,
        ),
        sa.Column(
            "closed_by_user_id",
            sa.Uuid(),
            nullable=True,
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
        sa.Column(
            "cancellation_reason",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "subtotal_cents",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "discount_cents",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "total_cents",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "paid_cents",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "opened_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "CURRENT_TIMESTAMP"
            ),
            nullable=False,
        ),
        sa.Column(
            "closed_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "cancelled_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        *timestamp_columns(),
        sa.CheckConstraint(
            "subtotal_cents >= 0",
            name=(
                "ck_service_orders_"
                "subtotal_non_negative"
            ),
        ),
        sa.CheckConstraint(
            "discount_cents >= 0",
            name=(
                "ck_service_orders_"
                "discount_non_negative"
            ),
        ),
        sa.CheckConstraint(
            "total_cents >= 0",
            name=(
                "ck_service_orders_"
                "total_non_negative"
            ),
        ),
        sa.CheckConstraint(
            "paid_cents >= 0",
            name=(
                "ck_service_orders_"
                "paid_non_negative"
            ),
        ),
        sa.CheckConstraint(
            (
                "status IN "
                "('open', 'closed', 'cancelled')"
            ),
            name="ck_service_orders_status",
        ),
        sa.ForeignKeyConstraint(
            ["customer_id"],
            ["customers.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["appointment_id"],
            ["appointments.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["opened_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["closed_by_user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_service_orders_number",
        "service_orders",
        ["number"],
        unique=True,
    )

    op.create_index(
        "ix_service_orders_customer_id",
        "service_orders",
        ["customer_id"],
        unique=False,
    )

    op.create_index(
        "ix_service_orders_appointment_id",
        "service_orders",
        ["appointment_id"],
        unique=True,
    )

    op.create_index(
        "ix_service_orders_opened_by_user_id",
        "service_orders",
        ["opened_by_user_id"],
        unique=False,
    )

    op.create_index(
        "ix_service_orders_closed_by_user_id",
        "service_orders",
        ["closed_by_user_id"],
        unique=False,
    )

    op.create_index(
        "ix_service_orders_status",
        "service_orders",
        ["status"],
        unique=False,
    )

    op.create_index(
        "ix_service_orders_opened_at",
        "service_orders",
        ["opened_at"],
        unique=False,
    )

    op.create_index(
        "ix_service_orders_closed_at",
        "service_orders",
        ["closed_at"],
        unique=False,
    )

    op.create_index(
        "ix_service_orders_cancelled_at",
        "service_orders",
        ["cancelled_at"],
        unique=False,
    )

    op.create_table(
        "service_order_items",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "service_order_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "item_type",
            sa.String(length=24),
            nullable=False,
        ),
        sa.Column(
            "service_id",
            sa.Uuid(),
            nullable=True,
        ),
        sa.Column(
            "product_id",
            sa.Uuid(),
            nullable=True,
        ),
        sa.Column(
            "barber_id",
            sa.Uuid(),
            nullable=True,
        ),
        sa.Column(
            "stock_movement_id",
            sa.Uuid(),
            nullable=True,
        ),
        sa.Column(
            "name",
            sa.String(length=160),
            nullable=False,
        ),
        sa.Column(
            "quantity",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "unit_price_cents",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "total_cents",
            sa.Integer(),
            nullable=False,
        ),
        *timestamp_columns(),
        sa.CheckConstraint(
            "quantity > 0",
            name=(
                "ck_service_order_items_"
                "quantity_positive"
            ),
        ),
        sa.CheckConstraint(
            "unit_price_cents >= 0",
            name=(
                "ck_service_order_items_"
                "unit_price_non_negative"
            ),
        ),
        sa.CheckConstraint(
            "total_cents >= 0",
            name=(
                "ck_service_order_items_"
                "total_non_negative"
            ),
        ),
        sa.CheckConstraint(
            (
                "item_type IN "
                "('service', 'product')"
            ),
            name=(
                "ck_service_order_items_"
                "item_type"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["service_order_id"],
            ["service_orders.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["service_id"],
            ["services.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["barber_id"],
            ["barbers.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["stock_movement_id"],
            ["stock_movements.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        (
            "ix_service_order_items_"
            "service_order_id"
        ),
        "service_order_items",
        ["service_order_id"],
        unique=False,
    )

    op.create_index(
        "ix_service_order_items_item_type",
        "service_order_items",
        ["item_type"],
        unique=False,
    )

    op.create_index(
        "ix_service_order_items_service_id",
        "service_order_items",
        ["service_id"],
        unique=False,
    )

    op.create_index(
        "ix_service_order_items_product_id",
        "service_order_items",
        ["product_id"],
        unique=False,
    )

    op.create_index(
        "ix_service_order_items_barber_id",
        "service_order_items",
        ["barber_id"],
        unique=False,
    )

    op.create_index(
        (
            "ix_service_order_items_"
            "stock_movement_id"
        ),
        "service_order_items",
        ["stock_movement_id"],
        unique=True,
    )

    op.create_table(
        "service_order_payments",
        sa.Column(
            "id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "service_order_id",
            sa.Uuid(),
            nullable=False,
        ),
        sa.Column(
            "payment_method",
            sa.String(length=32),
            nullable=False,
        ),
        sa.Column(
            "amount_cents",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "reference",
            sa.String(length=120),
            nullable=True,
        ),
        sa.Column(
            "paid_at",
            sa.DateTime(timezone=True),
            server_default=sa.text(
                "CURRENT_TIMESTAMP"
            ),
            nullable=False,
        ),
        *timestamp_columns(),
        sa.CheckConstraint(
            "amount_cents > 0",
            name=(
                "ck_service_order_payments_"
                "amount_positive"
            ),
        ),
        sa.CheckConstraint(
            (
                "payment_method IN "
                "('cash', 'pix', "
                "'credit_card', "
                "'debit_card', 'other')"
            ),
            name=(
                "ck_service_order_payments_"
                "payment_method"
            ),
        ),
        sa.ForeignKeyConstraint(
            ["service_order_id"],
            ["service_orders.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        (
            "ix_service_order_payments_"
            "service_order_id"
        ),
        "service_order_payments",
        ["service_order_id"],
        unique=False,
    )

    op.create_index(
        (
            "ix_service_order_payments_"
            "payment_method"
        ),
        "service_order_payments",
        ["payment_method"],
        unique=False,
    )

    op.create_index(
        (
            "ix_service_order_payments_"
            "reference"
        ),
        "service_order_payments",
        ["reference"],
        unique=False,
    )

    op.create_index(
        (
            "ix_service_order_payments_"
            "paid_at"
        ),
        "service_order_payments",
        ["paid_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        (
            "ix_service_order_payments_"
            "paid_at"
        ),
        table_name="service_order_payments",
    )

    op.drop_index(
        (
            "ix_service_order_payments_"
            "reference"
        ),
        table_name="service_order_payments",
    )

    op.drop_index(
        (
            "ix_service_order_payments_"
            "payment_method"
        ),
        table_name="service_order_payments",
    )

    op.drop_index(
        (
            "ix_service_order_payments_"
            "service_order_id"
        ),
        table_name="service_order_payments",
    )

    op.drop_table("service_order_payments")

    op.drop_index(
        (
            "ix_service_order_items_"
            "stock_movement_id"
        ),
        table_name="service_order_items",
    )

    op.drop_index(
        "ix_service_order_items_barber_id",
        table_name="service_order_items",
    )

    op.drop_index(
        "ix_service_order_items_product_id",
        table_name="service_order_items",
    )

    op.drop_index(
        "ix_service_order_items_service_id",
        table_name="service_order_items",
    )

    op.drop_index(
        "ix_service_order_items_item_type",
        table_name="service_order_items",
    )

    op.drop_index(
        (
            "ix_service_order_items_"
            "service_order_id"
        ),
        table_name="service_order_items",
    )

    op.drop_table("service_order_items")

    op.drop_index(
        "ix_service_orders_cancelled_at",
        table_name="service_orders",
    )

    op.drop_index(
        "ix_service_orders_closed_at",
        table_name="service_orders",
    )

    op.drop_index(
        "ix_service_orders_opened_at",
        table_name="service_orders",
    )

    op.drop_index(
        "ix_service_orders_status",
        table_name="service_orders",
    )

    op.drop_index(
        "ix_service_orders_closed_by_user_id",
        table_name="service_orders",
    )

    op.drop_index(
        "ix_service_orders_opened_by_user_id",
        table_name="service_orders",
    )

    op.drop_index(
        "ix_service_orders_appointment_id",
        table_name="service_orders",
    )

    op.drop_index(
        "ix_service_orders_customer_id",
        table_name="service_orders",
    )

    op.drop_index(
        "ix_service_orders_number",
        table_name="service_orders",
    )

    op.drop_table("service_orders")
