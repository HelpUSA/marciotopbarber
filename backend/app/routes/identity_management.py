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
from app.schemas.identity_management import (
    EmployeeCreate,
    EmployeePublic,
    EmployeeUpdate,
    RolePublic,
    UserAdminPublic,
    UserCreate,
    UserUpdate,
)
from app.services.identity_management_service import (
    IdentityManagementConflictError,
    IdentityManagementNotFoundError,
    create_employee,
    create_managed_user,
    get_user,
    list_employees,
    list_roles,
    list_users,
    update_employee,
    update_managed_user,
    user_to_data,
)


router = APIRouter(
    prefix="/api/v1/admin/identity",
    tags=["identity-management"],
)


UsersManager = Annotated[
    AuthContext,
    Depends(
        require_permission("users.manage")
    ),
]

EmployeesManager = Annotated[
    AuthContext,
    Depends(
        require_permission("employees.manage")
    ),
]


def handle_not_found(
    exc: IdentityManagementNotFoundError,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=str(exc),
    )


def handle_conflict(
    exc: IdentityManagementConflictError,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=str(exc),
    )


@router.get(
    "/roles",
    response_model=list[RolePublic],
)
def get_roles(
    database: Database,
    _context: UsersManager,
) -> list[RolePublic]:
    return [
        RolePublic(**item)
        for item in list_roles(database)
    ]


@router.get(
    "/users",
    response_model=list[UserAdminPublic],
)
def get_users(
    database: Database,
    _context: UsersManager,
) -> list[UserAdminPublic]:
    return [
        UserAdminPublic(**item)
        for item in list_users(database)
    ]


@router.post(
    "/users",
    response_model=UserAdminPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_user(
    payload: UserCreate,
    database: Database,
    context: UsersManager,
) -> UserAdminPublic:
    try:
        user = create_managed_user(
            database,
            payload,
            context.user.id,
        )
    except IdentityManagementConflictError as exc:
        raise handle_conflict(exc) from exc

    return UserAdminPublic(
        **user_to_data(database, user)
    )


@router.patch(
    "/users/{user_id}",
    response_model=UserAdminPublic,
)
def patch_user(
    user_id: UUID,
    payload: UserUpdate,
    database: Database,
    context: UsersManager,
) -> UserAdminPublic:
    if (
        user_id == context.user.id
        and payload.active is False
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "O usuário não pode desativar "
                "a própria conta."
            ),
        )

    try:
        user = update_managed_user(
            database,
            user_id,
            payload,
            context.user.id,
        )
    except IdentityManagementNotFoundError as exc:
        raise handle_not_found(exc) from exc
    except IdentityManagementConflictError as exc:
        raise handle_conflict(exc) from exc

    return UserAdminPublic(
        **user_to_data(database, user)
    )


@router.get(
    "/employees",
    response_model=list[EmployeePublic],
)
def get_employees(
    database: Database,
    _context: EmployeesManager,
) -> list[EmployeePublic]:
    return [
        EmployeePublic.model_validate(item)
        for item in list_employees(database)
    ]


@router.post(
    "/employees",
    response_model=EmployeePublic,
    status_code=status.HTTP_201_CREATED,
)
def post_employee(
    payload: EmployeeCreate,
    database: Database,
    context: EmployeesManager,
) -> EmployeePublic:
    try:
        employee = create_employee(
            database,
            payload,
            context.user.id,
        )
    except IdentityManagementNotFoundError as exc:
        raise handle_not_found(exc) from exc
    except IdentityManagementConflictError as exc:
        raise handle_conflict(exc) from exc

    return EmployeePublic.model_validate(
        employee
    )


@router.patch(
    "/employees/{employee_id}",
    response_model=EmployeePublic,
)
def patch_employee(
    employee_id: UUID,
    payload: EmployeeUpdate,
    database: Database,
    context: EmployeesManager,
) -> EmployeePublic:
    try:
        employee = update_employee(
            database,
            employee_id,
            payload,
            context.user.id,
        )
    except IdentityManagementNotFoundError as exc:
        raise handle_not_found(exc) from exc
    except IdentityManagementConflictError as exc:
        raise handle_conflict(exc) from exc

    return EmployeePublic.model_validate(
        employee
    )