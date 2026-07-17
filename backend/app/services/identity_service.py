from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import (
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
)
from app.models import (
    AuditLog,
    AuthSession,
    Permission,
    Role,
    RolePermission,
    User,
    UserRole,
)


SYSTEM_PERMISSIONS = {
    "admin.access": "Acessar área administrativa",
    "users.manage": "Gerenciar usuários",
    "employees.manage": "Gerenciar funcionários",
    "roles.manage": "Gerenciar papéis e permissões",
    "scheduling.manage": "Gerenciar jornadas e bloqueios",
    "appointments.manage": "Gerenciar agendamentos",
    "customers.manage": "Gerenciar clientes",
    "catalog.manage": "Gerenciar serviços e produtos",
    "inventory.manage": "Gerenciar estoque",
    "finance.manage": "Gerenciar financeiro",
    "reports.read": "Consultar relatórios",
}


class InvalidCredentialsError(RuntimeError):
    pass


class IdentityConflictError(RuntimeError):
    pass


def normalize_email(email: str) -> str:
    return email.strip().lower()


def seed_identity(database: Session) -> Role:
    permissions_by_code: dict[str, Permission] = {}

    for code, name in SYSTEM_PERMISSIONS.items():
        permission = database.scalar(
            select(Permission).where(
                Permission.code == code
            )
        )

        if permission is None:
            permission = Permission(
                code=code,
                name=name,
                active=True,
            )
            database.add(permission)
            database.flush()

        permissions_by_code[code] = permission

    administrator = database.scalar(
        select(Role).where(
            Role.slug == "administrator"
        )
    )

    if administrator is None:
        administrator = Role(
            name="Administrador",
            slug="administrator",
            description=(
                "Acesso integral à plataforma."
            ),
            active=True,
        )
        database.add(administrator)
        database.flush()

    linked_permission_ids = set(
        database.scalars(
            select(RolePermission.permission_id).where(
                RolePermission.role_id
                == administrator.id
            )
        ).all()
    )

    for permission in permissions_by_code.values():
        if permission.id not in linked_permission_ids:
            database.add(
                RolePermission(
                    role_id=administrator.id,
                    permission_id=permission.id,
                )
            )

    database.commit()

    return administrator


def create_user(
    database: Session,
    *,
    name: str,
    email: str,
    password: str,
    role_slugs: list[str],
) -> User:
    normalized_email = normalize_email(email)

    existing = database.scalar(
        select(User).where(
            User.email == normalized_email
        )
    )

    if existing is not None:
        raise IdentityConflictError(
            "Já existe um usuário com esse e-mail."
        )

    roles = list(
        database.scalars(
            select(Role).where(
                Role.slug.in_(role_slugs),
                Role.active.is_(True),
            )
        ).all()
    )

    found_slugs = {role.slug for role in roles}
    missing = set(role_slugs) - found_slugs

    if missing:
        raise IdentityConflictError(
            "Papéis não encontrados: "
            + ", ".join(sorted(missing))
        )

    user = User(
        name=name.strip(),
        email=normalized_email,
        password_hash=hash_password(password),
        active=True,
    )

    database.add(user)
    database.flush()

    for role in roles:
        database.add(
            UserRole(
                user_id=user.id,
                role_id=role.id,
            )
        )

    database.add(
        AuditLog(
            user_id=user.id,
            action="identity.user_created",
            entity_type="user",
            entity_id=str(user.id),
            details={
                "roles": sorted(role_slugs),
            },
        )
    )

    database.commit()
    database.refresh(user)

    return user


def authenticate_user(
    database: Session,
    email: str,
    password: str,
) -> User:
    normalized_email = normalize_email(email)

    user = database.scalar(
        select(User).where(
            User.email == normalized_email
        )
    )

    if (
        user is None
        or not user.active
        or not verify_password(
            password,
            user.password_hash,
        )
    ):
        raise InvalidCredentialsError(
            "E-mail ou senha inválidos."
        )

    user.last_login_at = datetime.now(UTC)

    database.add(
        AuditLog(
            user_id=user.id,
            action="identity.login",
            entity_type="user",
            entity_id=str(user.id),
        )
    )

    database.commit()
    database.refresh(user)

    return user


def create_session(
    database: Session,
    user: User,
    duration_hours: int,
) -> tuple[AuthSession, str]:
    raw_token = generate_session_token()
    now = datetime.now(UTC)

    session = AuthSession(
        user_id=user.id,
        token_hash=hash_session_token(raw_token),
        expires_at=now + timedelta(
            hours=duration_hours
        ),
        last_used_at=now,
    )

    database.add(session)
    database.commit()
    database.refresh(session)

    return session, raw_token


def get_session_by_token(
    database: Session,
    raw_token: str,
) -> AuthSession | None:
    now = datetime.now(UTC)

    session = database.scalar(
        select(AuthSession).where(
            AuthSession.token_hash
            == hash_session_token(raw_token),
            AuthSession.revoked_at.is_(None),
            AuthSession.expires_at > now,
        )
    )

    if session is None:
        return None

    if not session.user.active:
        return None

    session.last_used_at = now
    database.commit()

    return session


def revoke_session(
    database: Session,
    session: AuthSession,
) -> None:
    session.revoked_at = datetime.now(UTC)

    database.add(
        AuditLog(
            user_id=session.user_id,
            action="identity.logout",
            entity_type="auth_session",
            entity_id=str(session.id),
        )
    )

    database.commit()


def user_role_slugs(
    database: Session,
    user_id: UUID,
) -> list[str]:
    return sorted(
        database.scalars(
            select(Role.slug)
            .join(
                UserRole,
                UserRole.role_id == Role.id,
            )
            .where(
                UserRole.user_id == user_id,
                Role.active.is_(True),
            )
        ).all()
    )


def user_permission_codes(
    database: Session,
    user_id: UUID,
) -> list[str]:
    return sorted(
        set(
            database.scalars(
                select(Permission.code)
                .join(
                    RolePermission,
                    RolePermission.permission_id
                    == Permission.id,
                )
                .join(
                    UserRole,
                    UserRole.role_id
                    == RolePermission.role_id,
                )
                .join(
                    Role,
                    Role.id == UserRole.role_id,
                )
                .where(
                    UserRole.user_id == user_id,
                    Role.active.is_(True),
                    Permission.active.is_(True),
                )
            ).all()
        )
    )