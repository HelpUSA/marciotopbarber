from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

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

    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )
    phone: Mapped[str] = mapped_column(
        String(32),
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


class Service(TimestampMixin, Base):
    __tablename__ = "services"

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
    duration_minutes: Mapped[int] = mapped_column(Integer)
    price_cents: Mapped[int] = mapped_column(Integer)
    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="service"
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
