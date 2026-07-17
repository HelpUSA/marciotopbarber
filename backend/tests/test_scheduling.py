from sqlalchemy import func, select

from app.models import (
    Appointment,
    Barber,
    Customer,
    Service,
)


def seed_catalog(database):
    barber = Barber(
        name="Marcio",
        slug="marcio",
        active=True,
    )

    inactive_barber = Barber(
        name="Inativo",
        slug="inativo",
        active=False,
    )

    service = Service(
        name="Corte",
        slug="corte",
        duration_minutes=45,
        price_cents=5000,
        active=True,
    )

    inactive_service = Service(
        name="Inativo",
        slug="servico-inativo",
        duration_minutes=30,
        price_cents=3000,
        active=False,
    )

    database.add_all(
        [
            barber,
            inactive_barber,
            service,
            inactive_service,
        ]
    )
    database.commit()

    return barber, service


def appointment_payload(
    barber,
    service,
    starts_at: str,
) -> dict[str, str]:
    return {
        "customer_name": "Cliente Teste",
        "customer_email": "cliente@example.com",
        "customer_phone": "+55 (83) 99999-9999",
        "barber_id": str(barber.id),
        "service_id": str(service.id),
        "starts_at": starts_at,
        "notes": "Primeiro atendimento",
    }


def test_public_catalogs_hide_inactive(
    client,
    db_session,
):
    seed_catalog(db_session)

    barbers = client.get(
        "/api/v1/barbers"
    )
    services = client.get(
        "/api/v1/services"
    )

    assert barbers.status_code == 200
    assert services.status_code == 200

    assert [
        item["slug"]
        for item in barbers.json()
    ] == ["marcio"]

    assert [
        item["slug"]
        for item in services.json()
    ] == ["corte"]


def test_create_appointment(
    client,
    db_session,
):
    barber, service = seed_catalog(
        db_session
    )

    response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            barber,
            service,
            "2035-07-20T14:00:00-03:00",
        ),
    )

    assert response.status_code == 201

    payload = response.json()

    assert payload["status"] == "scheduled"
    assert payload["barber"]["slug"] == "marcio"
    assert payload["service"]["slug"] == "corte"
    assert (
        payload["customer_phone"]
        == "5583999999999"
    )


def test_customer_is_reused(
    client,
    db_session,
):
    barber, service = seed_catalog(
        db_session
    )

    first = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            barber,
            service,
            "2035-07-20T14:00:00-03:00",
        ),
    )

    second = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            barber,
            service,
            "2035-07-20T16:00:00-03:00",
        ),
    )

    assert first.status_code == 201
    assert second.status_code == 201

    customer_count = db_session.scalar(
        select(func.count(Customer.id))
    )

    appointment_count = db_session.scalar(
        select(func.count(Appointment.id))
    )

    assert customer_count == 1
    assert appointment_count == 2


def test_overlap_returns_conflict(
    client,
    db_session,
):
    barber, service = seed_catalog(
        db_session
    )

    first = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            barber,
            service,
            "2035-07-20T14:00:00-03:00",
        ),
    )

    conflict = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            barber,
            service,
            "2035-07-20T14:30:00-03:00",
        ),
    )

    assert first.status_code == 201
    assert conflict.status_code == 409

    assert conflict.json() == {
        "detail": (
            "O horário selecionado "
            "não está disponível."
        )
    }


def test_naive_datetime_is_rejected(
    client,
    db_session,
):
    barber, service = seed_catalog(
        db_session
    )

    response = client.post(
        "/api/v1/appointments",
        json=appointment_payload(
            barber,
            service,
            "2035-07-20T14:00:00",
        ),
    )

    assert response.status_code == 422
