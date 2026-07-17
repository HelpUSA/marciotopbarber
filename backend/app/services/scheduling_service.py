from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Appointment,
    Barber,
    Customer,
    Service,
)
from app.schemas.scheduling import AppointmentCreate


class SchedulingNotFoundError(RuntimeError):
    pass


class SchedulingConflictError(RuntimeError):
    pass


class SchedulingValidationError(RuntimeError):
    pass


def as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)

    return value.astimezone(UTC)


def list_active_barbers(
    database: Session,
) -> list[Barber]:
    statement = (
        select(Barber)
        .where(Barber.active.is_(True))
        .order_by(Barber.name)
    )

    return list(
        database.scalars(statement).all()
    )


def list_active_services(
    database: Session,
) -> list[Service]:
    statement = (
        select(Service)
        .where(Service.active.is_(True))
        .order_by(Service.name)
    )

    return list(
        database.scalars(statement).all()
    )


def get_active_barber(
    database: Session,
    barber_id,
) -> Barber:
    barber = database.scalar(
        select(Barber).where(
            Barber.id == barber_id,
            Barber.active.is_(True),
        )
    )

    if barber is None:
        raise SchedulingNotFoundError(
            "Barbeiro não encontrado."
        )

    return barber


def get_active_service(
    database: Session,
    service_id,
) -> Service:
    service = database.scalar(
        select(Service).where(
            Service.id == service_id,
            Service.active.is_(True),
        )
    )

    if service is None:
        raise SchedulingNotFoundError(
            "Serviço não encontrado."
        )

    return service


def get_or_create_customer(
    database: Session,
    payload: AppointmentCreate,
) -> Customer:
    customer = database.scalar(
        select(Customer)
        .where(
            Customer.phone
            == payload.customer_phone
        )
        .order_by(Customer.created_at)
    )

    email = (
        str(payload.customer_email)
        if payload.customer_email
        else None
    )

    if customer is None:
        customer = Customer(
            name=payload.customer_name,
            email=email,
            phone=payload.customer_phone,
        )

        database.add(customer)
        database.flush()

        return customer

    customer.name = payload.customer_name

    if email:
        customer.email = email

    return customer


def ensure_time_is_available(
    database: Session,
    barber: Barber,
    service: Service,
    starts_at: datetime,
) -> None:
    requested_start = as_utc(starts_at)

    if requested_start <= datetime.now(UTC):
        raise SchedulingValidationError(
            "O horário deve estar no futuro."
        )

    requested_end = (
        requested_start
        + timedelta(
            minutes=service.duration_minutes
        )
    )

    search_start = (
        requested_start - timedelta(days=1)
    )
    search_end = (
        requested_end + timedelta(days=1)
    )

    statement = (
        select(Appointment)
        .options(
            joinedload(Appointment.service)
        )
        .where(
            Appointment.barber_id == barber.id,
            Appointment.status.in_(
                [
                    "scheduled",
                    "confirmed",
                ]
            ),
            Appointment.starts_at >= search_start,
            Appointment.starts_at <= search_end,
        )
    )

    appointments = database.scalars(
        statement
    ).all()

    for appointment in appointments:
        existing_start = as_utc(
            appointment.starts_at
        )

        existing_end = (
            existing_start
            + timedelta(
                minutes=(
                    appointment.service.
                    duration_minutes
                )
            )
        )

        overlaps = (
            requested_start < existing_end
            and requested_end > existing_start
        )

        if overlaps:
            raise SchedulingConflictError(
                "O horário selecionado "
                "não está disponível."
            )


def create_appointment(
    database: Session,
    payload: AppointmentCreate,
) -> Appointment:
    barber = get_active_barber(
        database,
        payload.barber_id,
    )

    service = get_active_service(
        database,
        payload.service_id,
    )

    ensure_time_is_available(
        database=database,
        barber=barber,
        service=service,
        starts_at=payload.starts_at,
    )

    customer = get_or_create_customer(
        database,
        payload,
    )

    appointment = Appointment(
        customer=customer,
        barber=barber,
        service=service,
        starts_at=payload.starts_at,
        status="scheduled",
        notes=payload.notes,
    )

    database.add(appointment)
    database.commit()
    database.refresh(appointment)

    return appointment
