from __future__ import annotations

from datetime import date, datetime, time
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    Time,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.db import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Customer(TimestampMixin, Base):
    __tablename__ = "customers"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(120)
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    phone: Mapped[str] = mapped_column(
        String(32),
        index=True,
    )
    birth_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
        index=True,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    loyalty_points: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )
    last_service_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )
    return_due_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="customer"
    )


class Barber(TimestampMixin, Base):

    __tablename__ = "barbers"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        index=True,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="barber"
    )

    schedules: Mapped[list["BarberSchedule"]] = relationship(
        back_populates="barber",
        cascade="all, delete-orphan",
    )

    blocks: Mapped[list["BarberBlock"]] = relationship(
        back_populates="barber",
        cascade="all, delete-orphan",
    )

    employee: Mapped["Employee | None"] = relationship(
        back_populates="barber",
        uselist=False,
    )


class ServiceCategory(TimestampMixin, Base):
    __tablename__ = "service_categories"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )
    name: Mapped[str] = mapped_column(
        String(120)
    )
    slug: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
    )
    position: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    services: Mapped[list["Service"]] = relationship(
        back_populates="category"
    )


class Service(TimestampMixin, Base):
    __tablename__ = "services"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )

    category_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "service_categories.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(120)
    )
    slug: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    duration_minutes: Mapped[int] = mapped_column(
        Integer
    )
    price_cents: Mapped[int] = mapped_column(
        Integer
    )
    position: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    category: Mapped["ServiceCategory | None"] = relationship(
        back_populates="services"
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="service"
    )


class BarberSchedule(TimestampMixin, Base):

    __tablename__ = "barber_schedules"

    __table_args__ = (
        CheckConstraint(
            "weekday >= 0 AND weekday <= 6",
            name="ck_barber_schedules_weekday",
        ),
        CheckConstraint(
            "end_time > start_time",
            name="ck_barber_schedules_time_order",
        ),
        UniqueConstraint(
            "barber_id",
            "weekday",
            "start_time",
            "end_time",
            name="uq_barber_schedule_window",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )

    barber_id: Mapped[UUID] = mapped_column(
        ForeignKey("barbers.id"),
        index=True,
    )
    weekday: Mapped[int] = mapped_column(
        Integer,
        index=True,
    )
    start_time: Mapped[time] = mapped_column(Time)
    end_time: Mapped[time] = mapped_column(Time)
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    barber: Mapped["Barber"] = relationship(
        back_populates="schedules"
    )


class BarberBlock(TimestampMixin, Base):
    __tablename__ = "barber_blocks"

    __table_args__ = (
        CheckConstraint(
            "ends_at > starts_at",
            name="ck_barber_blocks_time_order",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )

    barber_id: Mapped[UUID] = mapped_column(
        ForeignKey("barbers.id"),
        index=True,
    )
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )
    ends_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )
    reason: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    barber: Mapped["Barber"] = relationship(
        back_populates="blocks"
    )


class Appointment(TimestampMixin, Base):
    __tablename__ = "appointments"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )

    customer_id: Mapped[UUID] = mapped_column(
        ForeignKey("customers.id"),
        index=True,
    )
    barber_id: Mapped[UUID] = mapped_column(
        ForeignKey("barbers.id"),
        index=True,
    )
    service_id: Mapped[UUID] = mapped_column(
        ForeignKey("services.id"),
        index=True,
    )

    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(24),
        default="scheduled",
        index=True,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    customer: Mapped["Customer"] = relationship(
        back_populates="appointments"
    )
    barber: Mapped["Barber"] = relationship(
        back_populates="appointments"
    )
    service: Mapped["Service"] = relationship(
        back_populates="appointments"
    )


class Role(TimestampMixin, Base):
    __tablename__ = "roles"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(
        String(120),
        unique=True,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
    )

    permission_links: Mapped[list["RolePermission"]] = relationship(
        back_populates="role",
        cascade="all, delete-orphan",
    )
    user_links: Mapped[list["UserRole"]] = relationship(
        back_populates="role",
        cascade="all, delete-orphan",
    )


class Permission(TimestampMixin, Base):
    __tablename__ = "permissions"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )
    code: Mapped[str] = mapped_column(
        String(160),
        unique=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
    )

    role_links: Mapped[list["RolePermission"]] = relationship(
        back_populates="permission",
        cascade="all, delete-orphan",
    )


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    permission_id: Mapped[UUID] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    )

    role: Mapped["Role"] = relationship(
        back_populates="permission_links"
    )
    permission: Mapped["Permission"] = relationship(
        back_populates="role_links"
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )
    password_hash: Mapped[str] = mapped_column(String(512))
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
    )
    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    role_links: Mapped[list["UserRole"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[list["AuthSession"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
    )
    employee: Mapped["Employee | None"] = relationship(
        back_populates="user",
        uselist=False,
    )
    audit_logs: Mapped[list["AuditLog"]] = relationship(
        back_populates="user",
    )


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    role_id: Mapped[UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    )

    user: Mapped["User"] = relationship(
        back_populates="role_links"
    )
    role: Mapped["Role"] = relationship(
        back_populates="user_links"
    )


class Employee(TimestampMixin, Base):
    __tablename__ = "employees"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        unique=True,
    )
    barber_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("barbers.id"),
        nullable=True,
        unique=True,
    )
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    phone: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
    )
    job_title: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
    )

    user: Mapped["User | None"] = relationship(
        back_populates="employee"
    )
    barber: Mapped["Barber | None"] = relationship(
        back_populates="employee"
    )


class AuthSession(TimestampMixin, Base):
    __tablename__ = "auth_sessions"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(
        String(64),
        unique=True,
        index=True,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        index=True,
    )
    revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    user: Mapped["User"] = relationship(
        back_populates="sessions"
    )


class AuditLog(TimestampMixin, Base):
    __tablename__ = "audit_logs"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )
    action: Mapped[str] = mapped_column(
        String(160),
        index=True,
    )
    entity_type: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
        index=True,
    )
    entity_id: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
    )
    details: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )
    ip_address: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )
    user_agent: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )

    user: Mapped["User | None"] = relationship(
        back_populates="audit_logs"
    )


class Supplier(TimestampMixin, Base):
    __tablename__ = "suppliers"

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )
    legal_name: Mapped[str] = mapped_column(
        String(160)
    )
    trade_name: Mapped[str | None] = mapped_column(
        String(160),
        nullable=True,
        index=True,
    )
    document: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        unique=True,
        index=True,
    )
    contact_name: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    phone: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        index=True,
    )
    address: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    notes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
    )

    products: Mapped[list["Product"]] = relationship(
        back_populates="supplier"
    )

    stock_movements: Mapped[
        list["StockMovement"]
    ] = relationship(
        back_populates="supplier"
    )


class Product(TimestampMixin, Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint(
            "cost_cents >= 0",
            name="ck_products_cost_non_negative",
        ),
        CheckConstraint(
            "sale_price_cents >= 0",
            name=(
                "ck_products_sale_price_"
                "non_negative"
            ),
        ),
        CheckConstraint(
            "stock_quantity >= 0",
            name="ck_products_stock_non_negative",
        ),
        CheckConstraint(
            "minimum_stock >= 0",
            name=(
                "ck_products_minimum_stock_"
                "non_negative"
            ),
        ),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )
    supplier_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "suppliers.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    name: Mapped[str] = mapped_column(
        String(160),
        index=True,
    )
    sku: Mapped[str] = mapped_column(
        String(80),
        unique=True,
        index=True,
    )
    barcode: Mapped[str | None] = mapped_column(
        String(80),
        nullable=True,
        unique=True,
        index=True,
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    unit_label: Mapped[str] = mapped_column(
        String(24),
        default="un",
    )
    cost_cents: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )
    sale_price_cents: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )
    stock_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
        index=True,
    )
    minimum_stock: Mapped[int] = mapped_column(
        Integer,
        default=0,
        index=True,
    )
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        index=True,
    )

    supplier: Mapped["Supplier | None"] = relationship(
        back_populates="products"
    )

    stock_movements: Mapped[
        list["StockMovement"]
    ] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
    )


class StockMovement(TimestampMixin, Base):
    __tablename__ = "stock_movements"
    __table_args__ = (
        CheckConstraint(
            "quantity_delta <> 0",
            name=(
                "ck_stock_movements_"
                "quantity_non_zero"
            ),
        ),
        CheckConstraint(
            "stock_before >= 0",
            name=(
                "ck_stock_movements_"
                "before_non_negative"
            ),
        ),
        CheckConstraint(
            "stock_after >= 0",
            name=(
                "ck_stock_movements_"
                "after_non_negative"
            ),
        ),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid4,
    )
    product_id: Mapped[UUID] = mapped_column(
        ForeignKey(
            "products.id",
            ondelete="RESTRICT",
        ),
        index=True,
    )
    supplier_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "suppliers.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )
    movement_type: Mapped[str] = mapped_column(
        String(24),
        index=True,
    )
    quantity_delta: Mapped[int] = mapped_column(
        Integer
    )
    stock_before: Mapped[int] = mapped_column(
        Integer
    )
    stock_after: Mapped[int] = mapped_column(
        Integer
    )
    unit_cost_cents: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    reason: Mapped[str] = mapped_column(
        String(255)
    )
    reference: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
        index=True,
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    product: Mapped["Product"] = relationship(
        back_populates="stock_movements"
    )
    supplier: Mapped["Supplier | None"] = relationship(
        back_populates="stock_movements"
    )
