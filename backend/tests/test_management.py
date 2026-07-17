from datetime import UTC, datetime

from app.models import (
    Appointment,
    Barber,
    Customer,
    Service,
)


AUTH = {"X-Admin-Key": "test-admin-key"}


def seed_management(database):
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

    appointment = Appointment(
        customer=customer,
        barber=barber,
        service=service,
        starts_at=datetime(
            2035,
            7,
            20,
            17,
            0,
            tzinfo=UTC,
        ),
        status="scheduled",
    )

    database.add(appointment)
    database.commit()

    return barber, appointment


def test_admin_key_is_required(
    client,
    db_session,
):
    barber, _ = seed_management(db_session)

    response = client.get(
        (
            f"/api/v1/admin/barbers/"
            f"{barber.id}/schedules"
        )
    )

    assert response.status_code == 401


def test_create_and_list_schedule(
    client,
    db_session,
):
    barber, _ = seed_management(db_session)
    base_url = (
        f"/api/v1/admin/barbers/"
        f"{barber.id}/schedules"
    )

    created = client.post(
        base_url,
        headers=AUTH,
        json={
            "weekday": 0,
            "start_time": "09:00:00",
            "end_time": "12:00:00",
            "active": True,
        },
    )

    listed = client.get(
        base_url,
        headers=AUTH,
    )

    assert created.status_code == 201
    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert listed.json()[0]["weekday"] == 0


def test_overlapping_schedule_returns_conflict(
    client,
    db_session,
):
    barber, _ = seed_management(db_session)
    url = (
        f"/api/v1/admin/barbers/"
        f"{barber.id}/schedules"
    )

    first = client.post(
        url,
        headers=AUTH,
        json={
            "weekday": 1,
            "start_time": "09:00:00",
            "end_time": "12:00:00",
        },
    )

    conflict = client.post(
        url,
        headers=AUTH,
        json={
            "weekday": 1,
            "start_time": "11:00:00",
            "end_time": "14:00:00",
        },
    )

    assert first.status_code == 201
    assert conflict.status_code == 409


def test_create_list_and_delete_block(
    client,
    db_session,
):
    barber, _ = seed_management(db_session)
    base_url = (
        f"/api/v1/admin/barbers/"
        f"{barber.id}/blocks"
    )

    created = client.post(
        base_url,
        headers=AUTH,
        json={
            "starts_at": (
                "2035-07-20T12:00:00-03:00"
            ),
            "ends_at": (
                "2035-07-20T13:00:00-03:00"
            ),
            "reason": "Almoço",
        },
    )

    assert created.status_code == 201

    block_id = created.json()["id"]

    listed = client.get(
        base_url,
        headers=AUTH,
    )

    removed = client.delete(
        f"{base_url}/{block_id}",
        headers=AUTH,
    )

    empty = client.get(
        base_url,
        headers=AUTH,
    )

    assert listed.status_code == 200
    assert len(listed.json()) == 1
    assert removed.status_code == 204
    assert empty.json() == []


def test_list_appointments(
    client,
    db_session,
):
    _, appointment = seed_management(
        db_session
    )

    response = client.get(
        "/api/v1/admin/appointments",
        headers=AUTH,
        params={
            "status": "scheduled"
        },
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert (
        response.json()[0]["id"]
        == str(appointment.id)
    )


def test_update_appointment_status(
    client,
    db_session,
):
    _, appointment = seed_management(
        db_session
    )

    response = client.patch(
        (
            f"/api/v1/admin/appointments/"
            f"{appointment.id}/status"
        ),
        headers=AUTH,
        json={
            "status": "confirmed"
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"


def test_invalid_status_is_rejected(
    client,
    db_session,
):
    _, appointment = seed_management(
        db_session
    )

    response = client.patch(
        (
            f"/api/v1/admin/appointments/"
            f"{appointment.id}/status"
        ),
        headers=AUTH,
        json={
            "status": "invalid"
        },
    )

    assert response.status_code == 422
