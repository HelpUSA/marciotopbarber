
from sqlalchemy import select

from app.core.config import Settings
from app.models import ExternalIdentity
from app.services import google_identity_service
from app.services.google_identity_service import (
    login_with_google,
)
from app.services.identity_service import (
    user_permission_codes,
    user_role_slugs,
)


def claims(
    *,
    subject: str,
    email: str,
    name: str,
) -> dict:
    return {
        "sub": subject,
        "email": email,
        "email_verified": True,
        "name": name,
        "picture": "https://example.test/avatar.png",
    }


def settings() -> Settings:
    return Settings(
        google_client_id="test-client.apps.googleusercontent.com",
        platform_superadmin_email=(
            "helpus.ecommerce@gmail.com"
        ),
        google_auto_provision_customers=True,
    )


def test_google_superadmin_receives_global_access(
    db_session,
    monkeypatch,
):
    monkeypatch.setattr(
        google_identity_service,
        "verify_google_credential",
        lambda credential, client_id: claims(
            subject="google-superadmin",
            email="helpus.ecommerce@gmail.com",
            name="HelpUS Ecommerce",
        ),
    )

    user = login_with_google(
        db_session,
        credential="x" * 120,
        settings=settings(),
    )

    roles = user_role_slugs(
        db_session,
        user.id,
    )
    permissions = user_permission_codes(
        db_session,
        user.id,
    )

    assert "platform-superadmin" in roles
    assert "platform.manage" in permissions
    assert "users.manage" in permissions
    assert "roles.manage" in permissions
    assert "commerce.manage" in permissions


def test_new_google_user_defaults_to_customer(
    db_session,
    monkeypatch,
):
    monkeypatch.setattr(
        google_identity_service,
        "verify_google_credential",
        lambda credential, client_id: claims(
            subject="google-customer",
            email="cliente@example.com",
            name="Cliente Google",
        ),
    )

    user = login_with_google(
        db_session,
        credential="y" * 120,
        settings=settings(),
    )

    roles = user_role_slugs(
        db_session,
        user.id,
    )
    permissions = user_permission_codes(
        db_session,
        user.id,
    )

    assert roles == ["customer"]
    assert permissions == ["customer.portal"]

    external_identity = db_session.scalar(
        select(ExternalIdentity).where(
            ExternalIdentity.user_id == user.id
        )
    )

    assert external_identity is not None
    assert external_identity.provider == "google"
    assert external_identity.subject == "google-customer"


def test_google_login_reuses_existing_identity(
    db_session,
    monkeypatch,
):
    monkeypatch.setattr(
        google_identity_service,
        "verify_google_credential",
        lambda credential, client_id: claims(
            subject="google-repeat",
            email="repeat@example.com",
            name="Repeat User",
        ),
    )

    first = login_with_google(
        db_session,
        credential="a" * 120,
        settings=settings(),
    )

    second = login_with_google(
        db_session,
        credential="b" * 120,
        settings=settings(),
    )

    assert first.id == second.id

    identities = list(
        db_session.scalars(
            select(ExternalIdentity).where(
                ExternalIdentity.user_id == first.id
            )
        ).all()
    )

    assert len(identities) == 1
