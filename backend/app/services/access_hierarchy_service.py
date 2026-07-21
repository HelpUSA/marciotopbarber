
from __future__ import annotations

from collections.abc import Iterable
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import (
    Permission,
    Role,
    RolePermission,
    UserRole,
)
from app.services.identity_service import (
    SYSTEM_PERMISSIONS,
)


ADDITIONAL_PERMISSIONS = {
    "platform.manage": (
        "Administrar toda a plataforma"
    ),
    "barbershops.manage": (
        "Administrar barbearias e vínculos"
    ),
    "content.manage": (
        "Gerenciar conteúdo público"
    ),
    "purchases.manage": (
        "Gerenciar compras"
    ),
    "commissions.manage": (
        "Gerenciar comissões"
    ),
    "commissions.own": (
        "Consultar as próprias comissões"
    ),
    "appointments.own": (
        "Consultar a própria agenda"
    ),
    "customer.portal": (
        "Acessar o portal do cliente"
    ),
}


ROLE_DEFINITIONS = {
    "platform-superadmin": {
        "name": "Superadministrador da plataforma",
        "description": (
            "Acesso integral global reservado "
            "à administração da plataforma."
        ),
        "active": True,
        "permissions": "__ALL__",
    },
    "barbershop-owner": {
        "name": "Proprietário da barbearia",
        "description": (
            "Administrador integral da própria "
            "barbearia. Será ativado somente após "
            "o isolamento multi-tenant."
        ),
        "active": False,
        "permissions": (
            "admin.access",
            "users.manage",
            "employees.manage",
            "roles.manage",
            "scheduling.manage",
            "appointments.manage",
            "customers.manage",
            "catalog.manage",
            "inventory.manage",
            "commerce.manage",
            "finance.manage",
            "reports.read",
            "content.manage",
            "purchases.manage",
            "commissions.manage",
        ),
    },
    "barbershop-administrator": {
        "name": "Administrador da barbearia",
        "description": (
            "Administração operacional da própria "
            "barbearia. Será ativado somente após "
            "o isolamento multi-tenant."
        ),
        "active": False,
        "permissions": (
            "admin.access",
            "employees.manage",
            "scheduling.manage",
            "appointments.manage",
            "customers.manage",
            "catalog.manage",
            "inventory.manage",
            "commerce.manage",
            "finance.manage",
            "reports.read",
            "content.manage",
            "purchases.manage",
            "commissions.manage",
        ),
    },
    "operator": {
        "name": "Operador",
        "description": (
            "Operação da agenda, clientes, catálogo, "
            "estoque e comandas. Será ativado por "
            "barbearia após o isolamento multi-tenant."
        ),
        "active": False,
        "permissions": (
            "admin.access",
            "appointments.manage",
            "customers.manage",
            "catalog.manage",
            "inventory.manage",
            "commerce.manage",
        ),
    },
    "employee": {
        "name": "Funcionário",
        "description": (
            "Acesso à própria agenda e às próprias "
            "comissões. Depende do escopo por barbearia."
        ),
        "active": False,
        "permissions": (
            "appointments.own",
            "commissions.own",
        ),
    },
    "customer": {
        "name": "Cliente",
        "description": (
            "Acesso ao portal do cliente e aos "
            "próprios agendamentos."
        ),
        "active": True,
        "permissions": (
            "customer.portal",
        ),
    },
}


def ensure_permission(
    database: Session,
    code: str,
    name: str,
) -> Permission:
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
    else:
        permission.name = name
        permission.active = True

    return permission


def ensure_role(
    database: Session,
    *,
    slug: str,
    name: str,
    description: str,
    active: bool,
) -> Role:
    role = database.scalar(
        select(Role).where(
            Role.slug == slug
        )
    )

    if role is None:
        role = Role(
            slug=slug,
            name=name,
            description=description,
            active=active,
        )
        database.add(role)
        database.flush()
    else:
        role.name = name
        role.description = description
        role.active = active

    return role


def link_permissions(
    database: Session,
    role: Role,
    permission_codes: Iterable[str],
) -> None:
    permissions = list(
        database.scalars(
            select(Permission).where(
                Permission.code.in_(
                    tuple(permission_codes)
                ),
                Permission.active.is_(True),
            )
        ).all()
    )

    linked_ids = set(
        database.scalars(
            select(
                RolePermission.permission_id
            ).where(
                RolePermission.role_id == role.id
            )
        ).all()
    )

    for permission in permissions:
        if permission.id not in linked_ids:
            database.add(
                RolePermission(
                    role_id=role.id,
                    permission_id=permission.id,
                )
            )


def seed_access_hierarchy(
    database: Session,
) -> dict[str, Role]:
    all_definitions = {
        **SYSTEM_PERMISSIONS,
        **ADDITIONAL_PERMISSIONS,
    }

    for code, name in all_definitions.items():
        ensure_permission(
            database,
            code,
            name,
        )

    all_codes = tuple(
        database.scalars(
            select(Permission.code).where(
                Permission.active.is_(True)
            )
        ).all()
    )

    roles: dict[str, Role] = {}

    for slug, definition in ROLE_DEFINITIONS.items():
        role = ensure_role(
            database,
            slug=slug,
            name=definition["name"],
            description=definition["description"],
            active=definition["active"],
        )

        requested = definition["permissions"]

        if requested == "__ALL__":
            requested = all_codes

        link_permissions(
            database,
            role,
            requested,
        )

        roles[slug] = role

    legacy_administrator = database.scalar(
        select(Role).where(
            Role.slug == "administrator"
        )
    )

    if legacy_administrator is not None:
        link_permissions(
            database,
            legacy_administrator,
            all_codes,
        )

    database.commit()
    return roles


def assign_role(
    database: Session,
    *,
    user_id: UUID,
    role_slug: str,
) -> None:
    role = database.scalar(
        select(Role).where(
            Role.slug == role_slug,
            Role.active.is_(True),
        )
    )

    if role is None:
        raise RuntimeError(
            "Papel ativo não encontrado: "
            + role_slug
        )

    existing = database.scalar(
        select(UserRole).where(
            UserRole.user_id == user_id,
            UserRole.role_id == role.id,
        )
    )

    if existing is None:
        database.add(
            UserRole(
                user_id=user_id,
                role_id=role.id,
            )
        )

        # Torna o vínculo visível a uma segunda chamada
        # na mesma transação, mesmo com autoflush desativado.
        database.flush()
