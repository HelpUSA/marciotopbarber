from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Appointment,
    Barber,
    BarberBlock,
    BarberSchedule,
)
from app.schemas.management import (
    BlockCreate,
    ScheduleCreate,
)


class ManagementNotFoundError(RuntimeError):
    pass


class ManagementConflictError(RuntimeError):
    pass


def get_barber(
    database: Session,
    barber_id: UUID,
) -> Barber:
    barber = database.get(Barber, barber_id)

    if barber is None:
        raise ManagementNotFoundError(
            "Barbeiro não encontrado."
        )

    return barber


def list_schedules(
    database: Session,
    barber_id: UUID,
) -> list[BarberSchedule]:
    get_barber(database, barber_id)

    statement = (
        select(BarberSchedule)
        .where(
            BarberSchedule.barber_id == barber_id
        )
        .order_by(
            BarberSchedule.weekday,
            BarberSchedule.start_time,
        )
    )

    return list(
        database.scalars(statement).all()
    )


def create_schedule(
    database: Session,
    barber_id: UUID,
    payload: ScheduleCreate,
) -> BarberSchedule:
    barber = get_barber(database, barber_id)

    existing = database.scalars(
        select(BarberSchedule).where(
            BarberSchedule.barber_id == barber_id,
            BarberSchedule.weekday == payload.weekday,
            BarberSchedule.active.is_(True),
        )
    ).all()

    for schedule in existing:
        overlaps = (
            payload.start_time < schedule.end_time
            and payload.end_time > schedule.start_time
        )

        if overlaps:
            raise ManagementConflictError(
                "A jornada sobrepõe outra janela ativa."
            )

    schedule = BarberSchedule(
        barber=barber,
        weekday=payload.weekday,
        start_time=payload.start_time,
        end_time=payload.end_time,
        active=payload.active,
    )

    database.add(schedule)
    database.commit()
    database.refresh(schedule)

    return schedule


def delete_schedule(
    database: Session,
    barber_id: UUID,
    schedule_id: UUID,
) -> None:
    schedule = database.scalar(
        select(BarberSchedule).where(
            BarberSchedule.id == schedule_id,
            BarberSchedule.barber_id == barber_id,
        )
    )

    if schedule is None:
        raise ManagementNotFoundError(
            "Jornada não encontrada."
        )

    database.delete(schedule)
    database.commit()


def list_blocks(
    database: Session,
    barber_id: UUID,
) -> list[BarberBlock]:
    get_barber(database, barber_id)

    statement = (
        select(BarberBlock)
        .where(
            BarberBlock.barber_id == barber_id
        )
        .order_by(BarberBlock.starts_at)
    )

    return list(
        database.scalars(statement).all()
    )


def create_block(
    database: Session,
    barber_id: UUID,
    payload: BlockCreate,
) -> BarberBlock:
    barber = get_barber(database, barber_id)

    existing = database.scalars(
        select(BarberBlock).where(
            BarberBlock.barber_id == barber_id,
            BarberBlock.starts_at < payload.ends_at,
            BarberBlock.ends_at > payload.starts_at,
        )
    ).all()

    if existing:
        raise ManagementConflictError(
            "O bloqueio sobrepõe outro bloqueio."
        )

    block = BarberBlock(
        barber=barber,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        reason=payload.reason,
    )

    database.add(block)
    database.commit()
    database.refresh(block)

    return block


def delete_block(
    database: Session,
    barber_id: UUID,
    block_id: UUID,
) -> None:
    block = database.scalar(
        select(BarberBlock).where(
            BarberBlock.id == block_id,
            BarberBlock.barber_id == barber_id,
        )
    )

    if block is None:
        raise ManagementNotFoundError(
            "Bloqueio não encontrado."
        )

    database.delete(block)
    database.commit()


def list_appointments(
    database: Session,
    status_filter: str | None = None,
    barber_id: UUID | None = None,
    starts_from: datetime | None = None,
    starts_to: datetime | None = None,
) -> list[Appointment]:
    statement = (
        select(Appointment)
        .options(
            joinedload(Appointment.customer),
            joinedload(Appointment.barber),
            joinedload(Appointment.service),
        )
        .order_by(Appointment.starts_at)
    )

    if status_filter:
        statement = statement.where(
            Appointment.status == status_filter
        )

    if barber_id:
        statement = statement.where(
            Appointment.barber_id == barber_id
        )

    if starts_from:
        statement = statement.where(
            Appointment.starts_at >= starts_from
        )

    if starts_to:
        statement = statement.where(
            Appointment.starts_at <= starts_to
        )

    return list(
        database.scalars(statement).all()
    )


def update_appointment_status(
    database: Session,
    appointment_id: UUID,
    new_status: str,
) -> Appointment:
    appointment = database.scalar(
        select(Appointment)
        .options(
            joinedload(Appointment.customer),
            joinedload(Appointment.barber),
            joinedload(Appointment.service),
        )
        .where(Appointment.id == appointment_id)
    )

    if appointment is None:
        raise ManagementNotFoundError(
            "Agendamento não encontrado."
        )

    appointment.status = new_status
    database.commit()
    database.refresh(appointment)

    return appointment
