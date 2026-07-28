
from __future__ import annotations

import secrets
from datetime import UTC, datetime
from typing import Any

from google.auth.transport import requests
from google.oauth2 import id_token
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import hash_password
from app.models import (
    AuditLog,
    ExternalIdentity,
    User,
)
from app.services.access_hierarchy_service import (
    assign_role,
    seed_access_hierarchy,
)
from app.services.identity_service import (
    normalize_email,
    seed_identity,
)


class GoogleIdentityError(RuntimeError):
    pass


def verify_google_credential(
    credential: str,
    client_id: str,
) -> dict[str, Any]:
    try:
        claims = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            client_id,
        )
    except Exception as exc:
        raise GoogleIdentityError(
            "A credencial Google é inválida ou expirou."
        ) from exc

    return dict(claims)


def login_with_google(
    database: Session,
    *,
    credential: str,
    settings: Settings,
) -> User:
    client_id = (
        settings.google_client_id or
        "812202824664-cnh072h6rkto1je3ouspq08qo73c674n.apps.googleusercontent.com"
    ).strip()

    if not client_id:
        client_id = "812202824664-cnh072h6rkto1je3ouspq08qo73c674n.apps.googleusercontent.com"

    claims = verify_google_credential(
        credential,
        client_id,
    )

    subject = str(
        claims.get("sub") or ""
    ).strip()

    email = normalize_email(
        str(claims.get("email") or "")
    )

    email_verified = claims.get(
        "email_verified"
    )

    if not subject:
        raise GoogleIdentityError(
            "A conta Google não possui identificador válido."
        )

    if not email or email_verified is not True:
        raise GoogleIdentityError(
            "A conta Google precisa ter e-mail verificado."
        )

    display_name = str(
        claims.get("name") or email.split("@")[0]
    ).strip()

    avatar_url = str(
        claims.get("picture") or ""
    ).strip() or None

    seed_identity(database)
    seed_access_hierarchy(database)

    external_identity = database.scalar(
        select(ExternalIdentity).where(
            ExternalIdentity.provider == "google",
            ExternalIdentity.subject == subject,
        )
    )

    user: User | None = None

    if external_identity is not None:
        user = database.get(
            User,
            external_identity.user_id,
        )

    if user is None:
        user = database.scalar(
            select(User).where(
                User.email == email
            )
        )

    if user is None:
        superadmin_email = normalize_email(
            settings.platform_superadmin_email
        )

        is_superadmin = (
            email == superadmin_email
        )

        if (
            not is_superadmin
            and not settings.google_auto_provision_customers
        ):
            raise GoogleIdentityError(
                "Esta conta ainda não foi autorizada."
            )

        user = User(
            name=display_name[:120],
            email=email,
            password_hash=hash_password(
                secrets.token_urlsafe(64)
            ),
            active=True,
        )
        database.add(user)
        database.flush()

        assign_role(
            database,
            user_id=user.id,
            role_slug=(
                "platform-superadmin"
                if is_superadmin
                else "customer"
            ),
        )

        database.add(
            AuditLog(
                user_id=user.id,
                action="identity.google_user_created",
                entity_type="user",
                entity_id=str(user.id),
                details={
                    "provider": "google",
                    "default_role": (
                        "platform-superadmin"
                        if is_superadmin
                        else "customer"
                    ),
                },
            )
        )

    if not user.active:
        raise GoogleIdentityError(
            "Esta conta está desativada."
        )

    if external_identity is None:
        external_identity = ExternalIdentity(
            user_id=user.id,
            provider="google",
            subject=subject,
            email=email,
            display_name=display_name[:160],
            avatar_url=avatar_url,
        )
        database.add(external_identity)
    else:
        external_identity.email = email
        external_identity.display_name = (
            display_name[:160]
        )
        external_identity.avatar_url = avatar_url

    superadmin_email = normalize_email(
        settings.platform_superadmin_email
    )

    if email == superadmin_email:
        assign_role(
            database,
            user_id=user.id,
            role_slug="platform-superadmin",
        )

    if not user.name.strip():
        user.name = display_name[:120]

    user.last_login_at = datetime.now(UTC)

    database.add(
        AuditLog(
            user_id=user.id,
            action="identity.google_login",
            entity_type="user",
            entity_id=str(user.id),
            details={
                "provider": "google",
            },
        )
    )

    database.commit()
    database.refresh(user)

    return user
