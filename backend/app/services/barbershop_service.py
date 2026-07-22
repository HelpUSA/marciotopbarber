
from __future__ import annotations

import re
from uuid import UUID

from sqlalchemy import (
    func,
    select,
)
from sqlalchemy.orm import Session

from app.models import (
    AuditLog,
    Barbershop,
    BarbershopMembership,
    User,
)
from app.schemas.barbershops import (
    BarbershopCreate,
    BarbershopUpdate,
    MembershipCreate,
    MembershipUpdate,
)
from app.services.identity_service import (
    user_permission_codes,
)


MEMBERSHIP_ROLES = {
    "barbershop-owner",
    "barbershop-administrator",
    "operator",
    "employee",
}

MEMBER_MANAGEMENT_ROLES = {
    "barbershop-owner",
    "barbershop-administrator",
}


class BarbershopNotFoundError(RuntimeError):
    pass


class BarbershopConflictError(RuntimeError):
    pass


class BarbershopPermissionError(RuntimeError):
    pass


def normalized_slug(value: str) -> str:
    slug = re.sub(
        r"[^a-z0-9]+",
        "-",
        value.strip().lower(),
    ).strip("-")

    if len(slug) < 2:
        raise BarbershopConflictError(
            "O slug da barbearia é inválido."
        )

    return slug


def is_platform_manager(
    database: Session,
    user_id: UUID,
) -> bool:
    return "platform.manage" in set(
        user_permission_codes(
            database,
            user_id,
        )
    )


def get_barbershop(
    database: Session,
    barbershop_id: UUID,
) -> Barbershop:
    barbershop = database.get(
        Barbershop,
        barbershop_id,
    )

    if barbershop is None:
        raise BarbershopNotFoundError(
            "Barbearia não encontrada."
        )

    return barbershop


def get_membership(
    database: Session,
    *,
    barbershop_id: UUID,
    user_id: UUID,
    active_only: bool = True,
) -> BarbershopMembership | None:
    statement = select(
        BarbershopMembership
    ).where(
        BarbershopMembership.barbershop_id
        == barbershop_id,
        BarbershopMembership.user_id
        == user_id,
    )

    if active_only:
        statement = statement.where(
            BarbershopMembership.active.is_(True)
        )

    return database.scalar(statement)


def management_scope(
    database: Session,
    *,
    barbershop_id: UUID,
    actor_user_id: UUID,
) -> str:
    if is_platform_manager(
        database,
        actor_user_id,
    ):
        return "platform"

    membership = get_membership(
        database,
        barbershop_id=barbershop_id,
        user_id=actor_user_id,
    )

    if (
        membership is None
        or membership.role
        not in MEMBER_MANAGEMENT_ROLES
    ):
        raise BarbershopPermissionError(
            "Você não possui autorização para "
            "administrar esta barbearia."
        )

    return membership.role


def validate_role_assignment(
    *,
    scope: str,
    target_role: str,
) -> None:
    if target_role not in MEMBERSHIP_ROLES:
        raise BarbershopConflictError(
            "O papel informado é inválido."
        )

    if scope == "platform":
        return

    if scope == "barbershop-owner":
        if target_role == "barbershop-owner":
            raise BarbershopPermissionError(
                "Somente o superadministrador da "
                "plataforma pode atribuir proprietários."
            )

        return

    if scope == "barbershop-administrator":
        if target_role not in {
            "operator",
            "employee",
        }:
            raise BarbershopPermissionError(
                "O administrador local somente pode "
                "atribuir operadores e funcionários."
            )

        return

    raise BarbershopPermissionError(
        "O usuário não pode gerenciar membros."
    )


def ensure_not_last_owner(
    database: Session,
    *,
    membership: BarbershopMembership,
    resulting_role: str,
    resulting_active: bool,
) -> None:
    if membership.role != "barbershop-owner":
        return

    if (
        resulting_role == "barbershop-owner"
        and resulting_active
    ):
        return

    other_active_owners = database.scalar(
        select(func.count())
        .select_from(BarbershopMembership)
        .where(
            BarbershopMembership.barbershop_id
            == membership.barbershop_id,
            BarbershopMembership.role
            == "barbershop-owner",
            BarbershopMembership.active.is_(True),
            BarbershopMembership.id
            != membership.id,
        )
    )

    if int(other_active_owners or 0) == 0:
        raise BarbershopConflictError(
            "A barbearia precisa manter ao menos "
            "um proprietário ativo."
        )


def audit(
    database: Session,
    *,
    actor_user_id: UUID,
    action: str,
    entity_type: str,
    entity_id: UUID,
    details: dict,
) -> None:
    database.add(
        AuditLog(
            user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details,
        )
    )


def create_barbershop(
    database: Session,
    *,
    payload: BarbershopCreate,
    actor_user_id: UUID,
) -> Barbershop:
    if not is_platform_manager(
        database,
        actor_user_id,
    ):
        raise BarbershopPermissionError(
            "Somente o superadministrador da "
            "plataforma pode criar barbearias."
        )

    slug = normalized_slug(
        payload.slug
    )

    existing = database.scalar(
        select(Barbershop).where(
            Barbershop.slug == slug
        )
    )

    if existing is not None:
        raise BarbershopConflictError(
            "Já existe uma barbearia com este slug."
        )

    owner: User | None = None

    if payload.owner_user_id is not None:
        owner = database.get(
            User,
            payload.owner_user_id,
        )

        if owner is None:
            raise BarbershopNotFoundError(
                "O proprietário informado não existe."
            )

        if not owner.active:
            raise BarbershopConflictError(
                "O proprietário informado está inativo."
            )

    barbershop = Barbershop(
        name=payload.name.strip(),
        slug=slug,
        document=payload.document,
        email=(
            str(payload.email)
            if payload.email
            else None
        ),
        phone=payload.phone,
        timezone=payload.timezone.strip(),
        active=True,
        settings={},
    )

    database.add(barbershop)
    database.flush()

    if owner is not None:
        database.add(
            BarbershopMembership(
                barbershop_id=barbershop.id,
                user_id=owner.id,
                role="barbershop-owner",
                active=True,
                invited_by_user_id=actor_user_id,
            )
        )

    audit(
        database,
        actor_user_id=actor_user_id,
        action="barbershop.created",
        entity_type="barbershop",
        entity_id=barbershop.id,
        details={
            "slug": barbershop.slug,
            "owner_user_id": (
                str(owner.id)
                if owner is not None
                else None
            ),
        },
    )

    database.commit()
    database.refresh(barbershop)

    return barbershop


def update_barbershop(
    database: Session,
    *,
    barbershop_id: UUID,
    payload: BarbershopUpdate,
    actor_user_id: UUID,
) -> Barbershop:
    scope = management_scope(
        database,
        barbershop_id=barbershop_id,
        actor_user_id=actor_user_id,
    )

    if (
        "active" in payload.model_fields_set
        and scope
        == "barbershop-administrator"
    ):
        raise BarbershopPermissionError(
            "O administrador local não pode ativar "
            "ou desativar a barbearia."
        )

    barbershop = get_barbershop(
        database,
        barbershop_id,
    )

    changed_fields: list[str] = []

    for field_name in (
        "name",
        "document",
        "phone",
        "timezone",
        "active",
    ):
        if field_name in payload.model_fields_set:
            setattr(
                barbershop,
                field_name,
                getattr(payload, field_name),
            )
            changed_fields.append(field_name)

    if "email" in payload.model_fields_set:
        barbershop.email = (
            str(payload.email)
            if payload.email
            else None
        )
        changed_fields.append("email")

    audit(
        database,
        actor_user_id=actor_user_id,
        action="barbershop.updated",
        entity_type="barbershop",
        entity_id=barbershop.id,
        details={
            "fields": sorted(changed_fields),
        },
    )

    database.commit()
    database.refresh(barbershop)

    return barbershop


def list_accessible_barbershops(
    database: Session,
    user_id: UUID,
) -> list[tuple[Barbershop, str | None]]:
    if is_platform_manager(
        database,
        user_id,
    ):
        barbershops = list(
            database.scalars(
                select(Barbershop).order_by(
                    Barbershop.name,
                    Barbershop.slug,
                )
            ).all()
        )

        return [
            (barbershop, None)
            for barbershop in barbershops
        ]

    rows = list(
        database.execute(
            select(
                BarbershopMembership,
                Barbershop,
            )
            .join(
                Barbershop,
                Barbershop.id
                == BarbershopMembership.barbershop_id,
            )
            .where(
                BarbershopMembership.user_id
                == user_id,
                BarbershopMembership.active.is_(True),
                Barbershop.active.is_(True),
            )
            .order_by(
                Barbershop.name,
                Barbershop.slug,
            )
        ).all()
    )

    return [
        (
            barbershop,
            membership.role,
        )
        for membership, barbershop in rows
    ]


def list_members(
    database: Session,
    *,
    barbershop_id: UUID,
    actor_user_id: UUID,
) -> list[tuple[BarbershopMembership, User]]:
    management_scope(
        database,
        barbershop_id=barbershop_id,
        actor_user_id=actor_user_id,
    )

    get_barbershop(
        database,
        barbershop_id,
    )

    return list(
        database.execute(
            select(
                BarbershopMembership,
                User,
            )
            .join(
                User,
                User.id
                == BarbershopMembership.user_id,
            )
            .where(
                BarbershopMembership.barbershop_id
                == barbershop_id
            )
            .order_by(
                User.name,
                User.email,
            )
        ).all()
    )


def add_or_update_member(
    database: Session,
    *,
    barbershop_id: UUID,
    payload: MembershipCreate,
    actor_user_id: UUID,
) -> BarbershopMembership:
    scope = management_scope(
        database,
        barbershop_id=barbershop_id,
        actor_user_id=actor_user_id,
    )

    validate_role_assignment(
        scope=scope,
        target_role=payload.role,
    )

    get_barbershop(
        database,
        barbershop_id,
    )

    user = database.get(
        User,
        payload.user_id,
    )

    if user is None:
        raise BarbershopNotFoundError(
            "Usuário não encontrado."
        )

    if not user.active:
        raise BarbershopConflictError(
            "O usuário informado está inativo."
        )

    membership = get_membership(
        database,
        barbershop_id=barbershop_id,
        user_id=payload.user_id,
        active_only=False,
    )

    created = membership is None

    if membership is None:
        membership = BarbershopMembership(
            barbershop_id=barbershop_id,
            user_id=payload.user_id,
            role=payload.role,
            active=payload.active,
            invited_by_user_id=actor_user_id,
        )

        database.add(membership)
    else:
        ensure_not_last_owner(
            database,
            membership=membership,
            resulting_role=payload.role,
            resulting_active=payload.active,
        )

        membership.role = payload.role
        membership.active = payload.active
        membership.invited_by_user_id = (
            actor_user_id
        )

    database.flush()

    audit(
        database,
        actor_user_id=actor_user_id,
        action=(
            "barbershop.member_created"
            if created
            else "barbershop.member_updated"
        ),
        entity_type="barbershop_membership",
        entity_id=membership.id,
        details={
            "barbershop_id": str(
                barbershop_id
            ),
            "user_id": str(
                payload.user_id
            ),
            "role": payload.role,
            "active": payload.active,
        },
    )

    database.commit()
    database.refresh(membership)

    return membership


def update_member(
    database: Session,
    *,
    barbershop_id: UUID,
    membership_id: UUID,
    payload: MembershipUpdate,
    actor_user_id: UUID,
) -> BarbershopMembership:
    scope = management_scope(
        database,
        barbershop_id=barbershop_id,
        actor_user_id=actor_user_id,
    )

    membership = database.scalar(
        select(
            BarbershopMembership
        ).where(
            BarbershopMembership.id
            == membership_id,
            BarbershopMembership.barbershop_id
            == barbershop_id,
        )
    )

    if membership is None:
        raise BarbershopNotFoundError(
            "Vínculo não encontrado."
        )

    resulting_role = (
        payload.role
        if payload.role is not None
        else membership.role
    )

    resulting_active = (
        payload.active
        if payload.active is not None
        else membership.active
    )

    validate_role_assignment(
        scope=scope,
        target_role=resulting_role,
    )

    if (
        membership.user_id
        == actor_user_id
        and resulting_active is False
    ):
        raise BarbershopConflictError(
            "O usuário não pode desativar "
            "o próprio vínculo."
        )

    ensure_not_last_owner(
        database,
        membership=membership,
        resulting_role=resulting_role,
        resulting_active=resulting_active,
    )

    changed_fields: list[str] = []

    if "role" in payload.model_fields_set:
        membership.role = resulting_role
        changed_fields.append("role")

    if "active" in payload.model_fields_set:
        membership.active = resulting_active
        changed_fields.append("active")

    audit(
        database,
        actor_user_id=actor_user_id,
        action="barbershop.member_updated",
        entity_type="barbershop_membership",
        entity_id=membership.id,
        details={
            "barbershop_id": str(
                barbershop_id
            ),
            "fields": sorted(changed_fields),
            "role": membership.role,
            "active": membership.active,
        },
    )

    database.commit()
    database.refresh(membership)

    return membership
