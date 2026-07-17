from __future__ import annotations

from datetime import datetime, time
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
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

    schedules: Mapped[list["BarberSchedule"]] = relationship(
        back_populates="barber",
        cascade="all, delete-orphan",
    )

    blocks: Mapped[list["BarberBlock"]] = relationship(
        back_populates="barber",
        cascade="all, delete-orphan",
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
