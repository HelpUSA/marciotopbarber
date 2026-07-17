from app.core.security import (
    hash_password,
    verify_password,
)
from app.models import User
from app.services.identity_service import (
    create_user,
    seed_identity,
)


PASSWORD = "SenhaMuitoForte123"


def create_admin(database):
    seed_identity(database)

    return create_user(
        database,
        name="Administrador",
        email="admin@example.com",
        password=PASSWORD,
        role_slugs=["administrator"],
    )


def test_password_hash_is_not_plaintext():
    encoded = hash_password(PASSWORD)

    assert PASSWORD not in encoded
    assert encoded.startswith("scrypt$")
    assert verify_password(PASSWORD, encoded)
    assert not verify_password(
        "SenhaIncorreta123",
        encoded,
    )


def test_login_and_current_user(
    client,
    db_session,
):
    create_admin(db_session)

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "ADMIN@EXAMPLE.COM",
            "password": PASSWORD,
        },
    )

    assert login.status_code == 200

    payload = login.json()

    assert payload["token_type"] == "bearer"
    assert payload["access_token"]
    assert payload["user"]["email"] == (
        "admin@example.com"
    )
    assert "administrator" in (
        payload["user"]["roles"]
    )
    assert "admin.access" in (
        payload["user"]["permissions"]
    )

    me = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": (
                "Bearer " +
                payload["access_token"]
            )
        },
    )

    assert me.status_code == 200
    assert me.json()["email"] == (
        "admin@example.com"
    )


def test_invalid_login_is_rejected(
    client,
    db_session,
):
    create_admin(db_session)

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@example.com",
            "password": "SenhaIncorreta123",
        },
    )

    assert response.status_code == 401


def test_inactive_user_cannot_login(
    client,
    db_session,
):
    user = create_admin(db_session)
    user.active = False
    db_session.commit()

    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@example.com",
            "password": PASSWORD,
        },
    )

    assert response.status_code == 401


def test_logout_revokes_session(
    client,
    db_session,
):
    create_admin(db_session)

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@example.com",
            "password": PASSWORD,
        },
    )

    token = login.json()["access_token"]
    headers = {
        "Authorization": f"Bearer {token}"
    }

    logout = client.post(
        "/api/v1/auth/logout",
        headers=headers,
    )

    assert logout.status_code == 204

    me = client.get(
        "/api/v1/auth/me",
        headers=headers,
    )

    assert me.status_code == 401


def test_email_must_be_unique(
    db_session,
):
    create_admin(db_session)

    users = db_session.query(User).all()

    assert len(users) == 1