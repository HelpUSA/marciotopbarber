
from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.core.auth import (
    AuthContext,
    Database,
    require_permission,
)
from app.schemas.barbershops import (
    BarbershopCreate,
    BarbershopPublic,
    BarbershopUpdate,
    MembershipCreate,
    MembershipPublic,
    MembershipUpdate,
)
from app.services.barbershop_service import (
    BarbershopConflictError,
    BarbershopNotFoundError,
    BarbershopPermissionError,
    add_or_update_member,
    create_barbershop,
    list_accessible_barbershops,
    list_members,
    update_barbershop,
    update_member,
)


router = APIRouter(
    prefix="/api/v1",
    tags=["barbershops"],
)


PlatformManager = Annotated[
    AuthContext,
    Depends(
        require_permission(
            "platform.manage"
        )
    ),
]

AuthenticatedUser = Annotated[
    AuthContext,
    Depends(
        require_permission(
            "customer.portal"
        )
    ),
]


def handle_error(
    exc: RuntimeError,
) -> HTTPException:
    if isinstance(
        exc,
        BarbershopNotFoundError,
    ):
        return HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )

    if isinstance(
        exc,
        BarbershopPermissionError,
    ):
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=str(exc),
    )


def barbershop_public(
    barbershop,
    role=None,
) -> BarbershopPublic:
    return BarbershopPublic(
        id=barbershop.id,
        name=barbershop.name,
        slug=barbershop.slug,
        document=barbershop.document,
        email=barbershop.email,
        phone=barbershop.phone,
        timezone=barbershop.timezone,
        active=barbershop.active,
        current_user_role=role,
    )


def membership_public(
    membership,
    user,
) -> MembershipPublic:
    return MembershipPublic(
        id=membership.id,
        user_id=user.id,
        user_name=user.name,
        user_email=user.email,
        role=membership.role,
        active=membership.active,
    )


@router.get(
    "/barbershops",
    response_model=list[BarbershopPublic],
)
def get_accessible_barbershops(
    database: Database,
    context: AuthenticatedUser,
) -> list[BarbershopPublic]:
    return [
        barbershop_public(
            barbershop,
            role,
        )
        for barbershop, role
        in list_accessible_barbershops(
            database,
            context.user.id,
        )
    ]


@router.post(
    "/platform/barbershops",
    response_model=BarbershopPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_barbershop(
    payload: BarbershopCreate,
    database: Database,
    context: PlatformManager,
) -> BarbershopPublic:
    try:
        barbershop = create_barbershop(
            database,
            payload=payload,
            actor_user_id=context.user.id,
        )
    except (
        BarbershopConflictError,
        BarbershopNotFoundError,
        BarbershopPermissionError,
    ) as exc:
        raise handle_error(exc) from exc

    return barbershop_public(
        barbershop,
    )


@router.patch(
    "/barbershops/{barbershop_id}",
    response_model=BarbershopPublic,
)
def patch_barbershop(
    barbershop_id: UUID,
    payload: BarbershopUpdate,
    database: Database,
    context: AuthenticatedUser,
) -> BarbershopPublic:
    try:
        barbershop = update_barbershop(
            database,
            barbershop_id=barbershop_id,
            payload=payload,
            actor_user_id=context.user.id,
        )
    except (
        BarbershopConflictError,
        BarbershopNotFoundError,
        BarbershopPermissionError,
    ) as exc:
        raise handle_error(exc) from exc

    return barbershop_public(
        barbershop,
    )


@router.get(
    "/barbershops/{barbershop_id}/members",
    response_model=list[MembershipPublic],
)
def get_barbershop_members(
    barbershop_id: UUID,
    database: Database,
    context: AuthenticatedUser,
) -> list[MembershipPublic]:
    try:
        members = list_members(
            database,
            barbershop_id=barbershop_id,
            actor_user_id=context.user.id,
        )
    except (
        BarbershopConflictError,
        BarbershopNotFoundError,
        BarbershopPermissionError,
    ) as exc:
        raise handle_error(exc) from exc

    return [
        membership_public(
            membership,
            user,
        )
        for membership, user in members
    ]


@router.post(
    "/barbershops/{barbershop_id}/members",
    response_model=MembershipPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_barbershop_member(
    barbershop_id: UUID,
    payload: MembershipCreate,
    database: Database,
    context: AuthenticatedUser,
) -> MembershipPublic:
    try:
        membership = add_or_update_member(
            database,
            barbershop_id=barbershop_id,
            payload=payload,
            actor_user_id=context.user.id,
        )

        members = list_members(
            database,
            barbershop_id=barbershop_id,
            actor_user_id=context.user.id,
        )

        user = next(
            user
            for item, user in members
            if item.id == membership.id
        )
    except (
        BarbershopConflictError,
        BarbershopNotFoundError,
        BarbershopPermissionError,
    ) as exc:
        raise handle_error(exc) from exc

    return membership_public(
        membership,
        user,
    )


@router.patch(
    (
        "/barbershops/{barbershop_id}/"
        "members/{membership_id}"
    ),
    response_model=MembershipPublic,
)
def patch_barbershop_member(
    barbershop_id: UUID,
    membership_id: UUID,
    payload: MembershipUpdate,
    database: Database,
    context: AuthenticatedUser,
) -> MembershipPublic:
    try:
        membership = update_member(
            database,
            barbershop_id=barbershop_id,
            membership_id=membership_id,
            payload=payload,
            actor_user_id=context.user.id,
        )

        members = list_members(
            database,
            barbershop_id=barbershop_id,
            actor_user_id=context.user.id,
        )

        user = next(
            user
            for item, user in members
            if item.id == membership.id
        )
    except (
        BarbershopConflictError,
        BarbershopNotFoundError,
        BarbershopPermissionError,
    ) as exc:
        raise handle_error(exc) from exc

    return membership_public(
        membership,
        user,
    )


from sqlalchemy import select as public_select
from app.models import Barbershop as PublicBarbershopModel
from app.schemas.barbershops import PublicBarbershopSummary


@router.get(
    "/public/barbershops",
    response_model=list[PublicBarbershopSummary],
)
def get_public_barbershops(
    database: Database,
) -> list[PublicBarbershopSummary]:
    rows = list(
        database.scalars(
            public_select(PublicBarbershopModel)
            .where(PublicBarbershopModel.active.is_(True))
            .order_by(PublicBarbershopModel.name, PublicBarbershopModel.slug)
        ).all()
    )
    return [
        PublicBarbershopSummary(
            id=item.id,
            name=item.name,
            slug=item.slug,
        )
        for item in rows
    ]
