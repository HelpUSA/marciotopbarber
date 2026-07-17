from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.scheduling import (
    AppointmentCreate,
    AppointmentCreated,
    BarberPublic,
    ServicePublic,
)
from app.services.scheduling_service import (
    SchedulingConflictError,
    SchedulingNotFoundError,
    SchedulingValidationError,
    create_appointment,
    list_active_barbers,
    list_active_services,
)


router = APIRouter(
    prefix="/api/v1",
    tags=["scheduling"],
)

Database = Annotated[
    Session,
    Depends(get_db),
]


@router.get(
    "/barbers",
    response_model=list[BarberPublic],
)
def get_barbers(
    database: Database,
) -> list[BarberPublic]:
    return [
        BarberPublic(
            id=barber.id,
            name=barber.name,
            slug=barber.slug,
        )
        for barber in list_active_barbers(
            database
        )
    ]


@router.get(
    "/services",
    response_model=list[ServicePublic],
)
def get_services(
    database: Database,
) -> list[ServicePublic]:
    return [
        ServicePublic(
            id=service.id,
            name=service.name,
            slug=service.slug,
            duration_minutes=(
                service.duration_minutes
            ),
            price_cents=service.price_cents,
        )
        for service in list_active_services(
            database
        )
    ]


@router.post(
    "/appointments",
    response_model=AppointmentCreated,
    status_code=status.HTTP_201_CREATED,
)
def post_appointment(
    payload: AppointmentCreate,
    database: Database,
) -> AppointmentCreated:
    try:
        appointment = create_appointment(
            database,
            payload,
        )
    except SchedulingNotFoundError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
    except SchedulingConflictError as exc:
        raise HTTPException(
            status_code=409,
            detail=str(exc),
        ) from exc
    except SchedulingValidationError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

    return AppointmentCreated(
        id=appointment.id,
        status=appointment.status,
        starts_at=appointment.starts_at,
        customer_name=(
            appointment.customer.name
        ),
        customer_email=(
            appointment.customer.email
        ),
        customer_phone=(
            appointment.customer.phone
        ),
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
                appointment.service.
                duration_minutes
            ),
            price_cents=(
                appointment.service.price_cents
            ),
        ),
        notes=appointment.notes,
    )
