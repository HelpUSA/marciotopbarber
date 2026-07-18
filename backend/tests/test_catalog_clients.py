from datetime import UTC, datetime
from uuid import UUID

from app.models import (
    Appointment,
    AuditLog,
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


def create_headers(
    client,
    database,
    *,
    email="admin@example.com",
    role_slug="administrator",
    permission_codes=None,
):
    seed_identity(database)

    if role_slug != "administrator":
        role = Role(
            name="Papel limitado",
            slug=role_slug,
            active=True,
        )

        for code in permission_codes or []:
            permission = database.query(
                Permission
            ).filter_by(
                code=code
            ).one()

            role.permission_links.append(
                RolePermission(
                    permission=permission
                )
            )

        database.add(role)
        database.commit()

    create_user(
        database,
        name="Administrador",
        email=email,
        password=PASSWORD,
        role_slugs=[role_slug],
    )

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": PASSWORD,
        },
    )

    assert login.status_code == 200

    return {
        "Authorization": (
            "Bearer "
            + login.json()["access_token"]
        )
    }


def test_admin_catalog_and_customers_require_auth(
    client,
):
    customers = client.get(
        "/api/v1/admin/customers"
    )

    services = client.get(
        "/api/v1/admin/services"
    )

    assert customers.status_code == 401
    assert services.status_code == 401


def test_customer_lifecycle(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    created = client.post(
        "/api/v1/admin/customers",
        headers=headers,
        json={
            "name": "Maria da Silva",
            "email": "MARIA@example.com",
            "phone": "(83) 99999-9999",
            "birth_date": "1990-05-10",
            "notes": (
                "Prefere atendimento pela manhã."
            ),
            "loyalty_points": 3,
            "active": True,
        },
    )

    assert created.status_code == 201
    assert created.json()["phone"] == (
        "83999999999"
    )
    assert created.json()["email"] == (
        "maria@example.com"
    )
    assert created.json()[
        "appointment_count"
    ] == 0

    customer_id = created.json()["id"]

    detail = client.get(
        (
            "/api/v1/admin/customers/"
            + customer_id
        ),
        headers=headers,
    )

    assert detail.status_code == 200

    updated = client.patch(
        (
            "/api/v1/admin/customers/"
            + customer_id
        ),
        headers=headers,
        json={
            "name": "Maria Silva",
            "loyalty_points": 5,
            "active": False,
        },
    )

    assert updated.status_code == 200
    assert updated.json()["name"] == (
        "Maria Silva"
    )
    assert updated.json()[
        "loyalty_points"
    ] == 5
    assert updated.json()["active"] is False

    listed = client.get(
        (
            "/api/v1/admin/customers"
            "?search=Maria"
            "&active=false"
        ),
        headers=headers,
    )

    assert listed.status_code == 200
    assert len(listed.json()) == 1

    actions = {
        item.action
        for item in db_session.query(
            AuditLog
        ).all()
    }

    assert (
        "customers.customer_created"
        in actions
    )
    assert (
        "customers.customer_updated"
        in actions
    )


def test_duplicate_customer_phone_rejected(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    first = client.post(
        "/api/v1/admin/customers",
        headers=headers,
        json={
            "name": "Cliente Um",
            "phone": "83988887777",
            "active": True,
        },
    )

    duplicate = client.post(
        "/api/v1/admin/customers",
        headers=headers,
        json={
            "name": "Cliente Dois",
            "phone": "(83) 98888-7777",
            "active": True,
        },
    )

    assert first.status_code == 201
    assert duplicate.status_code == 409


def test_customer_summary_uses_appointments(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    created = client.post(
        "/api/v1/admin/customers",
        headers=headers,
        json={
            "name": "Cliente Agenda",
            "phone": "83977776666",
        },
    )

    assert created.status_code == 201

    customer = db_session.get(
        Customer,
        UUID(created.json()["id"]),
    )

    barber = Barber(
        name="Marcio",
        slug="marcio-customer-summary",
        active=True,
    )

    service = Service(
        name="Corte",
        slug="corte-customer-summary",
        duration_minutes=45,
        price_cents=5000,
        active=True,
    )

    appointment = Appointment(
        customer=customer,
        barber=barber,
        service=service,
        starts_at=datetime(
            2035,
            8,
            10,
            14,
            0,
            tzinfo=UTC,
        ),
        status="completed",
    )

    db_session.add(appointment)
    db_session.commit()

    response = client.get(
        (
            "/api/v1/admin/customers/"
            + created.json()["id"]
        ),
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()[
        "appointment_count"
    ] == 1
    assert response.json()[
        "last_appointment_at"
    ] is not None


def test_category_and_service_lifecycle(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    category = client.post(
        "/api/v1/admin/service-categories",
        headers=headers,
        json={
            "name": "Cabelo e barba",
            "description": (
                "Serviços principais."
            ),
            "position": 1,
            "active": True,
        },
    )

    assert category.status_code == 201
    assert category.json()["slug"] == (
        "cabelo-e-barba"
    )

    service = client.post(
        "/api/v1/admin/services",
        headers=headers,
        json={
            "category_id": category.json()["id"],
            "name": "Corte premium",
            "description": (
                "Corte com acabamento."
            ),
            "duration_minutes": 60,
            "price_cents": 6500,
            "position": 1,
            "active": True,
        },
    )

    assert service.status_code == 201
    assert service.json()["slug"] == (
        "corte-premium"
    )
    assert service.json()["category"][
        "name"
    ] == "Cabelo e barba"

    listed = client.get(
        "/api/v1/admin/services",
        headers=headers,
    )

    assert listed.status_code == 200
    assert len(listed.json()) == 1

    public_services = client.get(
        "/api/v1/services"
    )

    assert public_services.status_code == 200
    assert len(public_services.json()) == 1

    updated = client.patch(
        (
            "/api/v1/admin/services/"
            + service.json()["id"]
        ),
        headers=headers,
        json={
            "price_cents": 7000,
            "active": False,
        },
    )

    assert updated.status_code == 200
    assert updated.json()["price_cents"] == 7000
    assert updated.json()["active"] is False

    public_after_update = client.get(
        "/api/v1/services"
    )

    assert (
        public_after_update.status_code
        == 200
    )
    assert public_after_update.json() == []

    actions = {
        item.action
        for item in db_session.query(
            AuditLog
        ).all()
    }

    assert "catalog.category_created" in actions
    assert "catalog.service_created" in actions
    assert "catalog.service_updated" in actions


def test_duplicate_category_slug_rejected(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    first = client.post(
        "/api/v1/admin/service-categories",
        headers=headers,
        json={
            "name": "Cabelo",
            "slug": "cabelo",
        },
    )

    duplicate = client.post(
        "/api/v1/admin/service-categories",
        headers=headers,
        json={
            "name": "Outra categoria",
            "slug": "CABELO",
        },
    )

    assert first.status_code == 201
    assert duplicate.status_code == 409


def test_category_update(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    created = client.post(
        "/api/v1/admin/service-categories",
        headers=headers,
        json={
            "name": "Barba",
            "position": 2,
        },
    )

    assert created.status_code == 201

    updated = client.patch(
        (
            "/api/v1/admin/service-categories/"
            + created.json()["id"]
        ),
        headers=headers,
        json={
            "name": "Barba premium",
            "active": False,
            "position": 3,
        },
    )

    assert updated.status_code == 200
    assert updated.json()["name"] == (
        "Barba premium"
    )
    assert updated.json()["active"] is False
    assert updated.json()["position"] == 3


def test_catalog_permission_is_required(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
        email="limited-catalog@example.com",
        role_slug="limited-catalog",
        permission_codes=[
            "admin.access",
            "customers.manage",
        ],
    )

    response = client.get(
        "/api/v1/admin/services",
        headers=headers,
    )

    assert response.status_code == 403


def test_customer_permission_is_required(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
        email="limited-customers@example.com",
        role_slug="limited-customers",
        permission_codes=[
            "admin.access",
            "catalog.manage",
        ],
    )

    response = client.get(
        "/api/v1/admin/customers",
        headers=headers,
    )

    assert response.status_code == 403
