from dataclasses import dataclass
from typing import Annotated, Callable

from fastapi import (
    Depends,
    HTTPException,
    status,
)
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import AuthSession, User
from app.services.identity_service import (
    get_session_by_token,
    user_permission_codes,
)


bearer = HTTPBearer(auto_error=False)

Database = Annotated[
    Session,
    Depends(get_db),
]


@dataclass
class AuthContext:
    user: User
    session: AuthSession
    permissions: set[str]


def get_auth_context(
    database: Database,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(bearer),
    ],
) -> AuthContext:
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticação necessária.",
        )

    session = get_session_by_token(
        database,
        credentials.credentials,
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão inválida ou expirada.",
        )

    permissions = set(
        user_permission_codes(
            database,
            session.user_id,
        )
    )

    return AuthContext(
        user=session.user,
        session=session,
        permissions=permissions,
    )


CurrentAuth = Annotated[
    AuthContext,
    Depends(get_auth_context),
]


def require_permission(
    permission_code: str,
) -> Callable:
    def dependency(
        context: CurrentAuth,
    ) -> AuthContext:
        if permission_code not in context.permissions:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permissão insuficiente.",
            )

        return context

    return dependency