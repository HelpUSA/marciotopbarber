from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)

from app.core.auth import (
    CurrentAuth,
    Database,
)
from app.core.config import (
    Settings,
    get_settings,
)
from app.schemas.identity import (
    LoginRequest,
    LoginResponse,
    UserPublic,
)
from app.services.identity_service import (
    InvalidCredentialsError,
    authenticate_user,
    create_session,
    revoke_session,
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
    "/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
    database: Database,
    settings: Settings = Depends(get_settings),
) -> LoginResponse:
    try:
        user = authenticate_user(
            database,
            payload.email,
            payload.password,
        )
    except InvalidCredentialsError as exc:
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


@router.get(
    "/me",
    response_model=UserPublic,
)
def me(
    context: CurrentAuth,
    database: Database,
) -> UserPublic:
    return user_to_public(
        database,
        context.user,
    )


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
def logout(
    context: CurrentAuth,
    database: Database,
) -> Response:
    revoke_session(
        database,
        context.session,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT
    )