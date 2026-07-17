import secrets
from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    Header,
    HTTPException,
    Query,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db import get_db
from app.schemas.management import (
    AppointmentAdminPublic,
    AppointmentStatusUpdate,
    BlockCreate,
    BlockPublic,
    ScheduleCreate,
    SchedulePublic,
)
from app.schemas.scheduling import (
    BarberPublic,
    ServicePublic,
)
from app.services.management_service import (
    ManagementConflictError,
    ManagementNotFoundError,
    create_block,
    create_schedule,
    delete_block,
    delete_schedule,
    list_appointments,
    list_blocks,
    list_schedules,
    update_appointment_status,
)


def require_admin_key(
    settings: Settings = Depends(get_settings),
    x_admin_key: Annotated[
        str | None,
        Header(alias="X-Admin-Key"),
    ] = None,
) -> None:
    configured_key = settings.admin_api_key

    if not configured_key:
        raise HTTPException(
            status_code=503,
            detail="Acesso administrativo não configurado.",
        )

    if not secrets.compare_digest(
        x_admin_key or "",
        configured_key,
    ):
        raise HTTPException(
            status_code=401,
            detail="Chave administrativa inválida.",
        )


router = APIRouter(
    prefix="/api/v1/admin",
    tags=["management"],
    dependencies=[Depends(require_admin_key)],
)

Database = Annotated[
    Session,
    Depends(get_db),
]


def appointment_to_public(
    appointment,
) -> AppointmentAdminPublic:
    return AppointmentAdminPublic(
        id=appointment.id,
        status=appointment.status,
        starts_at=appointment.starts_at,
        customer_name=appointment.customer.name,
        customer_email=appointment.customer.email,
        customer_phone=appointment.customer.phone,
        barber=BarberPublic(
            id=appointment.barber.id,
            name=appointment.barber.name,
            slug=appointment.barber.slug,
        ),
        service=ServicePublic(
            id=appointment.service.id,
            name=appointment.service.name,
            slug=appointment.service.slug,
            duration_minutes=(
                appointment.service.duration_minutes
            ),
            price_cents=appointment.service.price_cents,
        ),
        notes=appointment.notes,
    )


@router.get(
    "/barbers/{barber_id}/schedules",
    response_model=list[SchedulePublic],
)
def get_schedules(
    barber_id: UUID,
    database: Database,
) -> list[SchedulePublic]:
    try:
        schedules = list_schedules(
            database,
            barber_id,
        )
    except ManagementNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return [
        SchedulePublic.model_validate(item)
        for item in schedules
    ]


@router.post(
    "/barbers/{barber_id}/schedules",
    response_model=SchedulePublic,
    status_code=status.HTTP_201_CREATED,
)
def post_schedule(
    barber_id: UUID,
    payload: ScheduleCreate,
    database: Database,
) -> SchedulePublic:
    try:
        schedule = create_schedule(
            database,
            barber_id,
            payload,
        )
    except ManagementNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
    except ManagementConflictError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc

    return SchedulePublic.model_validate(schedule)


@router.delete(
    "/barbers/{barber_id}/schedules/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_schedule(
    barber_id: UUID,
    schedule_id: UUID,
    database: Database,
) -> Response:
    try:
        delete_schedule(
            database,
            barber_id,
            schedule_id,
        )
    except ManagementNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )


@router.get(
    "/barbers/{barber_id}/blocks",
    response_model=list[BlockPublic],
)
def get_blocks(
    barber_id: UUID,
    database: Database,
) -> list[BlockPublic]:
    try:
        blocks = list_blocks(
            database,
            barber_id,
        )
    except ManagementNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return [
        BlockPublic.model_validate(item)
        for item in blocks
    ]


@router.post(
    "/barbers/{barber_id}/blocks",
    response_model=BlockPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_block(
    barber_id: UUID,
    payload: BlockCreate,
    database: Database,
) -> BlockPublic:
    try:
        block = create_block(
            database,
            barber_id,
            payload,
        )
    except ManagementNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
    except ManagementConflictError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc

    return BlockPublic.model_validate(block)


@router.delete(
    "/barbers/{barber_id}/blocks/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_block(
    barber_id: UUID,
    block_id: UUID,
    database: Database,
) -> Response:
    try:
        delete_block(
            database,
            barber_id,
            block_id,
        )
    except ManagementNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )


@router.get(
    "/appointments",
    response_model=list[AppointmentAdminPublic],
)
def get_appointments(
    database: Database,
    status_filter: Annotated[
        str | None,
        Query(alias="status"),
    ] = None,
    barber_id: UUID | None = None,
    starts_from: datetime | None = None,
    starts_to: datetime | None = None,
) -> list[AppointmentAdminPublic]:
    appointments = list_appointments(
        database=database,
        status_filter=status_filter,
        barber_id=barber_id,
        starts_from=starts_from,
        starts_to=starts_to,
    )

    return [
        appointment_to_public(item)
        for item in appointments
    ]


@router.patch(
    "/appointments/{appointment_id}/status",
    response_model=AppointmentAdminPublic,
)
def patch_appointment_status(
    appointment_id: UUID,
    payload: AppointmentStatusUpdate,
    database: Database,
) -> AppointmentAdminPublic:
    try:
        appointment = update_appointment_status(
            database,
            appointment_id,
            payload.status,
        )
    except ManagementNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    return appointment_to_public(appointment)
