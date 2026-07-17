from app.models import (
    AuditLog,
    Barber,
    Permission,
    Role,
    RolePermission,
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

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@example.com",
            "password": PASSWORD,
        },
    )

    return {
        "Authorization": (
            "Bearer " +
            response.json()["access_token"]
        )
    }


def create_secondary_user(
    client,
    headers,
):
    response = client.post(
        "/api/v1/admin/identity/users",
        headers=headers,
        json={
            "name": "Funcionário Teste",
            "email": "funcionario@example.com",
            "password": PASSWORD,
            "role_slugs": [
                "administrator"
            ],
        },
    )

    assert response.status_code == 201

    return response.json()


def test_identity_management_requires_auth(
    client,
):
    response = client.get(
        "/api/v1/admin/identity/users"
    )

    assert response.status_code == 401


def test_list_roles(
    client,
    db_session,
):
    headers = admin_headers(
        client,
        db_session,
    )

    response = client.get(
        "/api/v1/admin/identity/roles",
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()[0]["slug"] == (
        "administrator"
    )
    assert "users.manage" in (
        response.json()[0]["permissions"]
    )


def test_create_and_list_user(
    client,
    db_session,
):
    headers = admin_headers(
        client,
        db_session,
    )

    created = create_secondary_user(
        client,
        headers,
    )

    listed = client.get(
        "/api/v1/admin/identity/users",
        headers=headers,
    )

    assert listed.status_code == 200
    assert len(listed.json()) == 2
    assert created["email"] in {
        item["email"]
        for item in listed.json()
    }


def test_duplicate_user_is_rejected(
    client,
    db_session,
):
    headers = admin_headers(
        client,
        db_session,
    )

    create_secondary_user(
        client,
        headers,
    )

    duplicate = client.post(
        "/api/v1/admin/identity/users",
        headers=headers,
        json={
            "name": "Outro Nome",
            "email": "FUNCIONARIO@example.com",
            "password": PASSWORD,
            "role_slugs": [
                "administrator"
            ],
        },
    )

    assert duplicate.status_code == 409


def test_update_user_and_password(
    client,
    db_session,
):
    headers = admin_headers(
        client,
        db_session,
    )

    created = create_secondary_user(
        client,
        headers,
    )

    new_password = "NovaSenhaMuitoForte456"

    updated = client.patch(
        (
            "/api/v1/admin/identity/users/"
            f"{created['id']}"
        ),
        headers=headers,
        json={
            "name": "Funcionário Atualizado",
            "password": new_password,
            "active": True,
        },
    )

    assert updated.status_code == 200
    assert updated.json()["name"] == (
        "Funcionário Atualizado"
    )

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "funcionario@example.com",
            "password": new_password,
        },
    )

    assert login.status_code == 200


def test_user_cannot_deactivate_self(
    client,
    db_session,
):
    headers = admin_headers(
        client,
        db_session,
    )

    me = client.get(
        "/api/v1/auth/me",
        headers=headers,
    )

    response = client.patch(
        (
            "/api/v1/admin/identity/users/"
            f"{me.json()['id']}"
        ),
        headers=headers,
        json={
            "active": False
        },
    )

    assert response.status_code == 409


def test_employee_lifecycle_and_unique_links(
    client,
    db_session,
):
    headers = admin_headers(
        client,
        db_session,
    )

    user = create_secondary_user(
        client,
        headers,
    )

    barber = Barber(
        name="Barbeiro Funcionário",
        slug="barbeiro-funcionario",
        active=True,
    )

    db_session.add(barber)
    db_session.commit()

    created = client.post(
        "/api/v1/admin/identity/employees",
        headers=headers,
        json={
            "name": "Funcionário Teste",
            "email": "funcionario@example.com",
            "phone": "83999999999",
            "job_title": "Barbeiro",
            "user_id": user["id"],
            "barber_id": str(barber.id),
            "active": True,
        },
    )

    assert created.status_code == 201

    updated = client.patch(
        (
            "/api/v1/admin/identity/employees/"
            f"{created.json()['id']}"
        ),
        headers=headers,
        json={
            "job_title": "Barbeiro Sênior"
        },
    )

    assert updated.status_code == 200
    assert updated.json()["job_title"] == (
        "Barbeiro Sênior"
    )

    listed = client.get(
        "/api/v1/admin/identity/employees",
        headers=headers,
    )

    assert listed.status_code == 200
    assert len(listed.json()) == 1

    duplicate = client.post(
        "/api/v1/admin/identity/employees",
        headers=headers,
        json={
            "name": "Duplicado",
            "user_id": user["id"],
            "active": True,
        },
    )

    assert duplicate.status_code == 409

    actions = {
        item.action
        for item in db_session.query(
            AuditLog
        ).all()
    }

    assert "identity.employee_created" in actions
    assert "identity.employee_updated" in actions


def test_user_management_permission(
    client,
    db_session,
):
    seed_identity(db_session)

    permission = db_session.query(
        Permission
    ).filter_by(
        code="admin.access"
    ).one()

    role = Role(
        name="Consulta",
        slug="identity-viewer",
        active=True,
    )

    role.permission_links.append(
        RolePermission(
            permission=permission
        )
    )

    db_session.add(role)
    db_session.commit()

    create_user(
        db_session,
        name="Consulta",
        email="consulta@example.com",
        password=PASSWORD,
        role_slugs=["identity-viewer"],
    )

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "consulta@example.com",
            "password": PASSWORD,
        },
    )

    response = client.get(
        "/api/v1/admin/identity/users",
        headers={
            "Authorization": (
                "Bearer " +
                login.json()["access_token"]
            )
        },
    )

    assert response.status_code == 403