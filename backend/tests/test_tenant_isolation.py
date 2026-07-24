from uuid import UUID, uuid4

import pytest
import sqlalchemy as sa
from sqlalchemy import ForeignKey, String, Uuid, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column

from app.core.tenant import (
    CrossTenantReferenceError,
    TENANT_TABLES,
    tenant_scope,
)
from app.models import Base, TenantScopedMixin


class ProbeBase(DeclarativeBase):
    pass


probe_barbershops = sa.Table(
    "barbershops",
    ProbeBase.metadata,
    sa.Column("id", Uuid, primary_key=True),
)


class TenantProbe(TenantScopedMixin, ProbeBase):
    __tablename__ = "tenant_probes"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(80), nullable=False)


class TenantParent(TenantScopedMixin, ProbeBase):
    __tablename__ = "tenant_parents"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(80), nullable=False)


class TenantChild(TenantScopedMixin, ProbeBase):
    __tablename__ = "tenant_children"
    id: Mapped[UUID] = mapped_column(Uuid, primary_key=True, default=uuid4)
    parent_id: Mapped[UUID] = mapped_column(
        ForeignKey("tenant_parents.id"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(80), nullable=False)


@pytest.fixture
def tenant_database():
    engine = sa.create_engine("sqlite://")
    ProbeBase.metadata.create_all(engine)
    shop_a = uuid4()
    shop_b = uuid4()
    with engine.begin() as connection:
        connection.execute(probe_barbershops.insert(), [{"id": shop_a}, {"id": shop_b}])
    try:
        yield engine, shop_a, shop_b
    finally:
        engine.dispose()


def test_all_commercial_models_are_tenant_scoped():
    mapped = {mapper.local_table.name: mapper.class_ for mapper in Base.registry.mappers}
    assert TENANT_TABLES
    assert not (set(TENANT_TABLES) - set(mapped))
    assert not {
        table
        for table in TENANT_TABLES
        if not issubclass(mapped[table], TenantScopedMixin)
    }


def test_query_returns_only_selected_tenant(tenant_database):
    engine, shop_a, shop_b = tenant_database
    with Session(engine) as database:
        with tenant_scope(shop_a):
            database.add(TenantProbe(name="Registro A"))
            database.commit()
        with tenant_scope(shop_b):
            database.add(TenantProbe(name="Registro B"))
            database.commit()
        with tenant_scope(shop_a):
            names_a = list(database.scalars(select(TenantProbe.name)).all())
        with tenant_scope(shop_b):
            names_b = list(database.scalars(select(TenantProbe.name)).all())
    assert names_a == ["Registro A"]
    assert names_b == ["Registro B"]


def test_new_record_receives_tenant(tenant_database):
    engine, shop_a, _ = tenant_database
    with Session(engine) as database:
        record = TenantProbe(name="Automático")
        with tenant_scope(shop_a):
            database.add(record)
            database.commit()
            database.refresh(record)
    assert record.barbershop_id == shop_a


def test_cross_tenant_reference_is_blocked(tenant_database):
    engine, shop_a, shop_b = tenant_database
    with Session(engine) as database:
        with tenant_scope(shop_a):
            parent = TenantParent(name="Parent A")
            database.add(parent)
            database.commit()
            parent_id = parent.id
        with tenant_scope(shop_b):
            database.add(TenantChild(parent_id=parent_id, name="Child B"))
            with pytest.raises(CrossTenantReferenceError):
                database.commit()
            database.rollback()


def test_api_registers_public_and_authenticated_tenant_dependencies():
    text = open("app/api.py", encoding="utf-8").read()
    assert "scheduling_router" in text
    assert "Depends(require_tenant_context)" in text
    assert text.count("Depends(require_tenant_access)") >= 3
