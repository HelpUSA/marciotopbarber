
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from app.core.auth import Database
from app.core.config import (
    Settings,
    get_settings,
)
from app.schemas.google_identity import (
    GoogleLoginRequest,
)
from app.schemas.identity import (
    LoginResponse,
    UserPublic,
)
from app.services.google_identity_service import (
    GoogleIdentityError,
    login_with_google,
)
from app.services.identity_service import (
    create_session,
    user_permission_codes,
    user_role_slugs,
)


router = APIRouter(
    prefix="/api/v1/auth",
    tags=["identity"],
)


def user_to_public(
    database,
    user,
) -> UserPublic:
    return UserPublic(
        id=user.id,
        name=user.name,
        email=user.email,
        active=user.active,
        roles=user_role_slugs(
            database,
            user.id,
        ),
        permissions=user_permission_codes(
            database,
            user.id,
        ),
    )


@router.post(
    "/google",
    response_model=LoginResponse,
)
def google_login(
    payload: GoogleLoginRequest,
    database: Database,
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    try:
        user = login_with_google(
            database,
            credential=payload.credential,
            settings=settings,
        )
    except GoogleIdentityError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc

    session, raw_token = create_session(
        database,
        user,
        settings.auth_session_duration_hours,
    )

    return LoginResponse(
        access_token=raw_token,
        expires_at=session.expires_at,
        user=user_to_public(
            database,
            user,
        ),
    )
