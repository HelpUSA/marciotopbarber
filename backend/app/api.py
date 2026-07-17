from fastapi import APIRouter, Depends, Form, HTTPException
from pydantic import EmailStr

from app.core.config import Settings, get_settings
from app.routes.identity import (
    router as identity_router,
)
from app.routes.management import (
    router as management_router,
)
from app.routes.scheduling import (
    router as scheduling_router,
)
from app.services.email_service import (
    EmailDeliveryError,
    send_contact_email,
)


router = APIRouter()


@router.get("/health", tags=["health"])
@router.get(
    "/api/v1/health",
    tags=["health"],
    include_in_schema=False,
)
async def health(
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
    }


@router.post("/api/v1/contact", tags=["contact"])
@router.post(
    "/send-email",
    tags=["contact"],
    include_in_schema=False,
)
async def submit_contact(
    nome: str = Form(
        ...,
        min_length=2,
        max_length=120,
    ),
    email: EmailStr = Form(...),
    mensagem: str = Form(
        ...,
        min_length=5,
        max_length=4000,
    ),
    settings: Settings = Depends(get_settings),
) -> dict[str, object]:
    if settings.missing_email_settings():
        raise HTTPException(
            status_code=503,
            detail="Serviço de contato não configurado.",
        )

    try:
        await send_contact_email(
            settings=settings,
            name=nome,
            email=str(email),
            message=mensagem,
        )
    except EmailDeliveryError as exc:
        raise HTTPException(
            status_code=502,
            detail="Não foi possível enviar a mensagem.",
        ) from exc

    return {
        "success": True,
        "message": "Mensagem enviada com sucesso.",
    }


router.include_router(scheduling_router)
router.include_router(identity_router)
router.include_router(management_router)
