from typing import Annotated
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    status,
)

from app.core.auth import (
    AuthContext,
    Database,
    require_permission,
)
from app.schemas.catalog_clients import (
    CustomerCreate,
    CustomerPublic,
    CustomerUpdate,
    ServiceAdminPublic,
    ServiceCategoryCreate,
    ServiceCategoryPublic,
    ServiceCategoryUpdate,
    ServiceCreate,
    ServiceUpdate,
)
from app.services.catalog_clients_service import (
    CatalogClientsConflictError,
    CatalogClientsNotFoundError,
    create_category,
    create_customer,
    create_service,
    customer_to_data,
    get_customer,
    list_categories,
    list_customers,
    list_services,
    service_to_data,
    update_category,
    update_customer,
    update_service,
)


router = APIRouter(
    prefix="/api/v1/admin",
    tags=["catalog-clients"],
)


CustomersManager = Annotated[
    AuthContext,
    Depends(
        require_permission(
            "customers.manage"
        )
    ),
]


CatalogManager = Annotated[
    AuthContext,
    Depends(
        require_permission(
            "catalog.manage"
        )
    ),
]


def not_found(
    exc: CatalogClientsNotFoundError,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=str(exc),
    )


def conflict(
    exc: CatalogClientsConflictError,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=str(exc),
    )


@router.get(
    "/customers",
    response_model=list[CustomerPublic],
)
def get_customers(
    database: Database,
    _context: CustomersManager,
    search: Annotated[
        str | None,
        Query(max_length=120),
    ] = None,
    active: bool | None = None,
) -> list[CustomerPublic]:
    return [
        CustomerPublic(**item)
        for item in list_customers(
            database,
            search=search,
            active=active,
        )
    ]


@router.get(
    "/customers/{customer_id}",
    response_model=CustomerPublic,
)
def get_customer_detail(
    customer_id: UUID,
    database: Database,
    _context: CustomersManager,
) -> CustomerPublic:
    try:
        customer = get_customer(
            database,
            customer_id,
        )
    except CatalogClientsNotFoundError as exc:
        raise not_found(exc) from exc

    return CustomerPublic(
        **customer_to_data(
            database,
            customer,
        )
    )


@router.post(
    "/customers",
    response_model=CustomerPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_customer(
    payload: CustomerCreate,
    database: Database,
    context: CustomersManager,
) -> CustomerPublic:
    try:
        customer = create_customer(
            database,
            payload,
            context.user.id,
        )
    except CatalogClientsConflictError as exc:
        raise conflict(exc) from exc

    return CustomerPublic(
        **customer_to_data(
            database,
            customer,
        )
    )


@router.patch(
    "/customers/{customer_id}",
    response_model=CustomerPublic,
)
def patch_customer(
    customer_id: UUID,
    payload: CustomerUpdate,
    database: Database,
    context: CustomersManager,
) -> CustomerPublic:
    try:
        customer = update_customer(
            database,
            customer_id,
            payload,
            context.user.id,
        )
    except CatalogClientsNotFoundError as exc:
        raise not_found(exc) from exc
    except CatalogClientsConflictError as exc:
        raise conflict(exc) from exc

    return CustomerPublic(
        **customer_to_data(
            database,
            customer,
        )
    )


@router.get(
    "/service-categories",
    response_model=list[
        ServiceCategoryPublic
    ],
)
def get_service_categories(
    database: Database,
    _context: CatalogManager,
    active: bool | None = None,
) -> list[ServiceCategoryPublic]:
    return [
        ServiceCategoryPublic.model_validate(
            item
        )
        for item in list_categories(
            database,
            active=active,
        )
    ]


@router.post(
    "/service-categories",
    response_model=ServiceCategoryPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_service_category(
    payload: ServiceCategoryCreate,
    database: Database,
    context: CatalogManager,
) -> ServiceCategoryPublic:
    try:
        category = create_category(
            database,
            payload,
            context.user.id,
        )
    except CatalogClientsConflictError as exc:
        raise conflict(exc) from exc

    return ServiceCategoryPublic.model_validate(
        category
    )


@router.patch(
    "/service-categories/{category_id}",
    response_model=ServiceCategoryPublic,
)
def patch_service_category(
    category_id: UUID,
    payload: ServiceCategoryUpdate,
    database: Database,
    context: CatalogManager,
) -> ServiceCategoryPublic:
    try:
        category = update_category(
            database,
            category_id,
            payload,
            context.user.id,
        )
    except CatalogClientsNotFoundError as exc:
        raise not_found(exc) from exc
    except CatalogClientsConflictError as exc:
        raise conflict(exc) from exc

    return ServiceCategoryPublic.model_validate(
        category
    )


@router.get(
    "/services",
    response_model=list[ServiceAdminPublic],
)
def get_admin_services(
    database: Database,
    _context: CatalogManager,
    search: Annotated[
        str | None,
        Query(max_length=120),
    ] = None,
    active: bool | None = None,
    category_id: UUID | None = None,
) -> list[ServiceAdminPublic]:
    return [
        ServiceAdminPublic(
            **service_to_data(
                database,
                item,
            )
        )
        for item in list_services(
            database,
            search=search,
            active=active,
            category_id=category_id,
        )
    ]


@router.post(
    "/services",
    response_model=ServiceAdminPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_service(
    payload: ServiceCreate,
    database: Database,
    context: CatalogManager,
) -> ServiceAdminPublic:
    try:
        service = create_service(
            database,
            payload,
            context.user.id,
        )
    except CatalogClientsNotFoundError as exc:
        raise not_found(exc) from exc
    except CatalogClientsConflictError as exc:
        raise conflict(exc) from exc

    return ServiceAdminPublic(
        **service_to_data(
            database,
            service,
        )
    )


@router.patch(
    "/services/{service_id}",
    response_model=ServiceAdminPublic,
)
def patch_service(
    service_id: UUID,
    payload: ServiceUpdate,
    database: Database,
    context: CatalogManager,
) -> ServiceAdminPublic:
    try:
        service = update_service(
            database,
            service_id,
            payload,
            context.user.id,
        )
    except CatalogClientsNotFoundError as exc:
        raise not_found(exc) from exc
    except CatalogClientsConflictError as exc:
        raise conflict(exc) from exc

    return ServiceAdminPublic(
        **service_to_data(
            database,
            service,
        )
    )
