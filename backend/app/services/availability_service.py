from datetime import UTC, date, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import Settings
from app.models import (
    Appointment,
    BarberBlock,
    BarberSchedule,
)
from app.services.scheduling_service import (
    as_utc,
    get_active_barber,
    get_active_service,
)


def overlaps(
    first_start: datetime,
    first_end: datetime,
    second_start: datetime,
    second_end: datetime,
) -> bool:
    return (
        first_start < second_end
        and first_end > second_start
    )


def list_available_slots(
    database: Session,
    settings: Settings,
    barber_id,
    service_id,
    requested_date: date,
) -> tuple[object, object, list[tuple[datetime, datetime]]]:
    barber = get_active_barber(
        database,
        barber_id,
    )

    service = get_active_service(
        database,
        service_id,
    )

    timezone = ZoneInfo(
        settings.business_timezone
    )

    day_start_local = datetime.combine(
        requested_date,
        time.min,
        tzinfo=timezone,
    )

    day_end_local = (
        day_start_local + timedelta(days=1)
    )

    day_start_utc = day_start_local.astimezone(UTC)
    day_end_utc = day_end_local.astimezone(UTC)

    schedule_statement = (
        select(BarberSchedule)
        .where(
            BarberSchedule.barber_id == barber.id,
            BarberSchedule.weekday
            == requested_date.weekday(),
            BarberSchedule.active.is_(True),
        )
        .order_by(BarberSchedule.start_time)
    )

    schedules = database.scalars(
        schedule_statement
    ).all()

    if not schedules:
        return barber, service, []

    appointment_statement = (
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
            Appointment.starts_at < day_end_utc,
            Appointment.starts_at >= (
                day_start_utc - timedelta(days=1)
            ),
        )
    )

    appointments = database.scalars(
        appointment_statement
    ).all()

    block_statement = select(BarberBlock).where(
        BarberBlock.barber_id == barber.id,
        BarberBlock.starts_at < day_end_utc,
        BarberBlock.ends_at > day_start_utc,
    )

    blocks = database.scalars(
        block_statement
    ).all()

    busy_periods: list[tuple[datetime, datetime]] = []

    for appointment in appointments:
        start = as_utc(appointment.starts_at)
        end = start + timedelta(
            minutes=(
                appointment.service.duration_minutes
            )
        )
        busy_periods.append((start, end))

    for block in blocks:
        busy_periods.append(
            (
                as_utc(block.starts_at),
                as_utc(block.ends_at),
            )
        )

    now_local = datetime.now(timezone)
    interval = timedelta(
        minutes=settings.slot_interval_minutes
    )
    duration = timedelta(
        minutes=service.duration_minutes
    )

    slots: list[tuple[datetime, datetime]] = []
    seen: set[datetime] = set()

    for schedule in schedules:
        window_start = datetime.combine(
            requested_date,
            schedule.start_time,
            tzinfo=timezone,
        )

        window_end = datetime.combine(
            requested_date,
            schedule.end_time,
            tzinfo=timezone,
        )

        cursor = window_start

        while cursor + duration <= window_end:
            slot_end = cursor + duration

            is_busy = any(
                overlaps(
                    cursor.astimezone(UTC),
                    slot_end.astimezone(UTC),
                    busy_start,
                    busy_end,
                )
                for busy_start, busy_end in busy_periods
            )

            if (
                cursor > now_local
                and not is_busy
                and cursor not in seen
            ):
                slots.append((cursor, slot_end))
                seen.add(cursor)

            cursor += interval

    slots.sort(key=lambda item: item[0])

    return barber, service, slots
