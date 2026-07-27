"""Scope commercial domains by barbershop.

Revision ID: 20260722_09
Revises: 20260721_08
Create Date: 2026-07-24
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

import sqlalchemy as sa
from alembic import op

revision = "20260722_09"
down_revision = "20260721_08"
branch_labels = None
depends_on = None

LEGACY_BARBERSHOP_ID = UUID("00000000-0000-4000-8000-000000000001")
LEGACY_BARBERSHOP_SLUG = "system-legacy-000000000001"
TENANT_TABLES = ['appointments', 'barber_blocks', 'barber_schedules', 'barbers', 'customers', 'employees', 'products', 'service_categories', 'service_order_items', 'service_order_payments', 'service_orders', 'services', 'stock_movements', 'suppliers']


def barbershops_table():
    return sa.table(
        "barbershops",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String(length=160)),
        sa.column("slug", sa.String(length=160)),
        sa.column("document", sa.String(length=32)),
        sa.column("email", sa.String(length=255)),
        sa.column("phone", sa.String(length=32)),
        sa.column("timezone", sa.String(length=64)),
        sa.column("active", sa.Boolean()),
        sa.column("settings", sa.JSON()),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )


def commercial_table(name: str):
    return sa.table(name, sa.column("barbershop_id", sa.Uuid()))


def upgrade() -> None:
    connection = op.get_bind()
    barbershops = barbershops_table()
    existing = connection.execute(
        sa.select(barbershops.c.id).where(barbershops.c.id == LEGACY_BARBERSHOP_ID)
    ).scalar_one_or_none()
    if existing is None:
        now = datetime.now(timezone.utc)
        connection.execute(barbershops.insert().values(
            id=LEGACY_BARBERSHOP_ID,
            name="Barbearia Legada",
            slug=LEGACY_BARBERSHOP_SLUG,
            document=None,
            email=None,
            phone=None,
            timezone="America/Recife",
            active=True,
            settings={},
            created_at=now,
            updated_at=now,
        ))
    for table_name in TENANT_TABLES:
        index_name = f"ix_{table_name}_barbershop_id"
        foreign_key_name = f"fk_{table_name}_barbershop_id_barbershops"
        with op.batch_alter_table(table_name) as batch:
            batch.add_column(sa.Column("barbershop_id", sa.Uuid(), nullable=True))
            batch.create_foreign_key(
                foreign_key_name,
                "barbershops",
                ["barbershop_id"],
                ["id"],
                ondelete="RESTRICT",
            )
            batch.create_index(index_name, ["barbershop_id"], unique=False)
        table = commercial_table(table_name)
        connection.execute(
            table.update()
            .where(table.c.barbershop_id.is_(None))
            .values(barbershop_id=LEGACY_BARBERSHOP_ID)
        )
        with op.batch_alter_table(table_name) as batch:
            batch.alter_column("barbershop_id", existing_type=sa.Uuid(), nullable=False)


def downgrade() -> None:
    connection = op.get_bind()
    for table_name in reversed(TENANT_TABLES):
        with op.batch_alter_table(table_name) as batch:
            batch.drop_index(f"ix_{table_name}_barbershop_id")
            batch.drop_constraint(
                f"fk_{table_name}_barbershop_id_barbershops",
                type_="foreignkey",
            )
            batch.drop_column("barbershop_id")
    memberships = sa.table(
        "barbershop_memberships",
        sa.column("barbershop_id", sa.Uuid()),
    )
    count = connection.execute(
        sa.select(sa.func.count())
        .select_from(memberships)
        .where(memberships.c.barbershop_id == LEGACY_BARBERSHOP_ID)
    ).scalar_one()
    if int(count or 0) == 0:
        barbershops = barbershops_table()
        connection.execute(
            barbershops.delete().where(barbershops.c.id == LEGACY_BARBERSHOP_ID)
        )
