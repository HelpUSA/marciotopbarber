from fastapi import APIRouter, Depends, Form, HTTPException
from pydantic import EmailStr

from app.core.config import Settings, get_settings
from fastapi import Depends
from app.core.tenant import (
    require_tenant_access,
    require_tenant_context,
)
from app.routes.barbershops import (
    router as barbershops_router,
)
from app.routes.google_identity import (
    router as google_identity_router,
)
from app.routes.service_orders import (
    router as service_orders_router,
)
from app.routes.inventory import (
    router as inventory_router,
)
from app.routes.catalog_clients import (
    router as catalog_clients_router,
)
from app.routes.identity_management import (
    router as identity_management_router,
)
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


router.include_router(scheduling_router, dependencies=[Depends(require_tenant_context)])
router.include_router(identity_router)
router.include_router(identity_management_router)
router.include_router(management_router, dependencies=[Depends(require_tenant_access)])
router.include_router(catalog_clients_router, dependencies=[Depends(require_tenant_access)])
router.include_router(inventory_router)
router.include_router(service_orders_router, dependencies=[Depends(require_tenant_access)])
router.include_router(google_identity_router)
router.include_router(barbershops_router)
