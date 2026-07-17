from datetime import UTC, date, datetime, time
from zoneinfo import ZoneInfo

from app.models import (
    Appointment,
    Barber,
    BarberBlock,
    BarberSchedule,
    Customer,
    Service,
)


def seed_availability(database):
    target_date = date(2035, 7, 16)
    timezone = ZoneInfo(
        "America/Fortaleza"
    )

    barber = Barber(
        name="Marcio",
        slug="marcio",
        active=True,
    )

    service = Service(
        name="Corte",
        slug="corte",
        duration_minutes=45,
        price_cents=5000,
        active=True,
    )

    customer = Customer(
        name="Cliente",
        email="cliente@example.com",
        phone="5583999999999",
    )

    barber.schedules.append(
        BarberSchedule(
            weekday=target_date.weekday(),
            start_time=time(9, 0),
            end_time=time(12, 0),
            active=True,
        )
    )

    appointment_start = datetime(
        2035,
        7,
        16,
        9,
        0,
        tzinfo=timezone,
    ).astimezone(UTC)

    appointment = Appointment(
        customer=customer,
        barber=barber,
        service=service,
        starts_at=appointment_start,
        status="scheduled",
    )

    block_start = datetime(
        2035,
        7,
        16,
        10,
        30,
        tzinfo=timezone,
    ).astimezone(UTC)

    block_end = datetime(
        2035,
        7,
        16,
        11,
        0,
        tzinfo=timezone,
    ).astimezone(UTC)

    barber.blocks.append(
        BarberBlock(
            starts_at=block_start,
            ends_at=block_end,
            reason="Intervalo",
        )
    )

    database.add(appointment)
    database.commit()

    return target_date, barber, service


def test_availability_excludes_busy_periods(
    client,
    db_session,
):
    target_date, barber, service = (
        seed_availability(db_session)
    )

    response = client.get(
        "/api/v1/availability",
        params={
            "barber_id": str(barber.id),
            "service_id": str(service.id),
            "date": target_date.isoformat(),
        },
    )

    assert response.status_code == 200

    payload = response.json()

    starts = [
        item["starts_at"][11:16]
        for item in payload["slots"]
    ]

    assert starts == [
        "09:45",
        "11:00",
        "11:15",
    ]

    assert (
        payload["timezone"]
        == "America/Fortaleza"
    )


def test_day_without_schedule_is_empty(
    client,
    db_session,
):
    target_date, barber, service = (
        seed_availability(db_session)
    )

    response = client.get(
        "/api/v1/availability",
        params={
            "barber_id": str(barber.id),
            "service_id": str(service.id),
            "date": target_date.replace(
                day=17
            ).isoformat(),
        },
    )

    assert response.status_code == 200
    assert response.json()["slots"] == []


def test_availability_rejects_unknown_barber(
    client,
    db_session,
):
    _, _, service = seed_availability(
        db_session
    )

    response = client.get(
        "/api/v1/availability",
        params={
            "barber_id": (
                "00000000-0000-0000-0000-"
                "000000000001"
            ),
            "service_id": str(service.id),
            "date": "2035-07-16",
        },
    )

    assert response.status_code == 404
