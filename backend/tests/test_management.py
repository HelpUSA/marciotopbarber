from datetime import UTC, datetime

from app.models import (
    Appointment,
    Barber,
    Customer,
    Permission,
    Role,
    RolePermission,
    Service,
)
from app.services.identity_service import (
    create_user,
    seed_identity,
)


PASSWORD = "SenhaMuitoForte123"


def admin_headers(
    client,
    database,
):
    seed_identity(database)

    create_user(
        database,
        name="Administrador",
        email="admin@example.com",
        password=PASSWORD,
        role_slugs=["administrator"],
    )

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@example.com",
            "password": PASSWORD,
        },
    )

    assert login.status_code == 200

    return {
        "Authorization": (
            "Bearer " +
            login.json()["access_token"]
        )
    }


def limited_headers(
    client,
    database,
):
    seed_identity(database)

    permission = database.query(
        Permission
    ).filter_by(
        code="admin.access"
    ).one()

    role = Role(
        name="Consulta",
        slug="viewer",
        active=True,
    )

    role.permission_links.append(
        RolePermission(
            permission=permission
        )
    )

    database.add(role)
    database.commit()

    create_user(
        database,
        name="Consulta",
        email="viewer@example.com",
        password=PASSWORD,
        role_slugs=["viewer"],
    )

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "viewer@example.com",
            "password": PASSWORD,
        },
    )

    return {
        "Authorization": (
            "Bearer " +
            login.json()["access_token"]
        )
    }


def seed_management(database):
    barber = Barber(
        name="Marcio",
        slug="marcio-management",
        active=True,
    )

    service = Service(
        name="Corte",
        slug="corte-management",
        duration_minutes=45,
        price_cents=5000,
        active=True,
    )

    customer = Customer(
        name="Cliente",
        email="cliente@example.com",
        phone="+5583999999999",
    )

    appointment = Appointment(
        customer=customer,
        barber=barber,
        service=service,
        starts_at=datetime(
            2035,
            7,
            17,
            13,
            0,
            tzinfo=UTC,
        ),
        status="scheduled",
    )

    database.add(appointment)
    database.commit()

    return barber, service, appointment


def test_admin_routes_require_bearer_token(
    client,
    db_session,
):
    response = client.get(
        "/api/v1/admin/appointments",
        headers={
            "X-Admin-Key": "test-admin-key"
        },
    )

    assert response.status_code == 401


def test_invalid_session_is_rejected(client):
    response = client.get(
        "/api/v1/admin/appointments",
        headers={
            "Authorization": "Bearer invalid"
        },
    )

    assert response.status_code == 401


def test_schedule_lifecycle(
    client,
    db_session,
):
    barber, _, _ = seed_management(
        db_session
    )

    headers = admin_headers(
        client,
        db_session,
    )

    base_url = (
        f"/api/v1/admin/barbers/"
        f"{barber.id}/schedules"
    )

    created = client.post(
        base_url,
        headers=headers,
        json={
            "weekday": 1,
            "start_time": "09:00:00",
            "end_time": "12:00:00",
            "active": True,
        },
    )

    assert created.status_code == 201

    overlap = client.post(
        base_url,
        headers=headers,
        json={
            "weekday": 1,
            "start_time": "11:00:00",
            "end_time": "13:00:00",
            "active": True,
        },
    )

    assert overlap.status_code == 409

    listed = client.get(
        base_url,
        headers=headers,
    )

    assert listed.status_code == 200
    assert len(listed.json()) == 1

    deleted = client.delete(
        (
            f"{base_url}/"
            f"{created.json()['id']}"
        ),
        headers=headers,
    )

    assert deleted.status_code == 204


def test_block_lifecycle(
    client,
    db_session,
):
    barber, _, _ = seed_management(
        db_session
    )

    headers = admin_headers(
        client,
        db_session,
    )

    base_url = (
        f"/api/v1/admin/barbers/"
        f"{barber.id}/blocks"
    )

    payload = {
        "starts_at": (
            "2035-07-17T14:00:00-03:00"
        ),
        "ends_at": (
            "2035-07-17T15:00:00-03:00"
        ),
        "reason": "Almoço",
    }

    created = client.post(
        base_url,
        headers=headers,
        json=payload,
    )

    assert created.status_code == 201

    overlap = client.post(
        base_url,
        headers=headers,
        json=payload,
    )

    assert overlap.status_code == 409

    listed = client.get(
        base_url,
        headers=headers,
    )

    assert listed.status_code == 200
    assert len(listed.json()) == 1

    deleted = client.delete(
        (
            f"{base_url}/"
            f"{created.json()['id']}"
        ),
        headers=headers,
    )

    assert deleted.status_code == 204


def test_list_appointments_with_filter(
    client,
    db_session,
):
    _, _, appointment = seed_management(
        db_session
    )

    headers = admin_headers(
        client,
        db_session,
    )

    response = client.get(
        (
            "/api/v1/admin/appointments"
            "?status=scheduled"
        ),
        headers=headers,
    )

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == str(
        appointment.id
    )


def test_update_appointment_status(
    client,
    db_session,
):
    _, _, appointment = seed_management(
        db_session
    )

    headers = admin_headers(
        client,
        db_session,
    )

    response = client.patch(
        (
            "/api/v1/admin/appointments/"
            f"{appointment.id}/status"
        ),
        headers=headers,
        json={
            "status": "confirmed"
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == (
        "confirmed"
    )


def test_insufficient_permission_is_rejected(
    client,
    db_session,
):
    barber, _, _ = seed_management(
        db_session
    )

    headers = limited_headers(
        client,
        db_session,
    )

    response = client.get(
        (
            f"/api/v1/admin/barbers/"
            f"{barber.id}/schedules"
        ),
        headers=headers,
    )

    assert response.status_code == 403