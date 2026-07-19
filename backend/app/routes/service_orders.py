from typing import Annotated, Literal
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
from app.schemas.service_orders import (
    ServiceOrderCancel,
    ServiceOrderClose,
    ServiceOrderCreate,
    ServiceOrderProductItemCreate,
    ServiceOrderPublic,
    ServiceOrdersSummary,
    ServiceOrderServiceItemCreate,
    ServiceOrderUpdate,
)
from app.services.service_orders_service import (
    ServiceOrderConflictError,
    ServiceOrderNotFoundError,
    add_product_item,
    add_service_item,
    cancel_order,
    close_order,
    create_order,
    get_order,
    list_orders,
    order_to_data,
    orders_summary,
    remove_item,
    update_order,
)


router = APIRouter(
    prefix="/api/v1/admin",
    tags=["service-orders"],
)


CommerceManager = Annotated[
    AuthContext,
    Depends(
        require_permission(
            "commerce.manage"
        )
    ),
]


OrderStatusFilter = Literal[
    "open",
    "closed",
    "cancelled",
]


def not_found(
    exc: ServiceOrderNotFoundError,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=str(exc),
    )


def conflict(
    exc: ServiceOrderConflictError,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=str(exc),
    )


@router.get(
    "/service-orders/summary",
    response_model=ServiceOrdersSummary,
)
def get_service_orders_summary(
    database: Database,
    _context: CommerceManager,
) -> ServiceOrdersSummary:
    return ServiceOrdersSummary(
        **orders_summary(database)
    )


@router.get(
    "/service-orders",
    response_model=list[
        ServiceOrderPublic
    ],
)
def get_service_orders(
    database: Database,
    _context: CommerceManager,
    search: Annotated[
        str | None,
        Query(max_length=160),
    ] = None,
    status_filter: Annotated[
        OrderStatusFilter | None,
        Query(alias="status"),
    ] = None,
    customer_id: UUID | None = None,
) -> list[ServiceOrderPublic]:
    return [
        ServiceOrderPublic(
            **order_to_data(order)
        )
        for order in list_orders(
            database,
            search=search,
            status=status_filter,
            customer_id=customer_id,
        )
    ]


@router.post(
    "/service-orders",
    response_model=ServiceOrderPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_service_order(
    payload: ServiceOrderCreate,
    database: Database,
    context: CommerceManager,
) -> ServiceOrderPublic:
    try:
        order = create_order(
            database,
            payload,
            context.user.id,
        )
    except ServiceOrderNotFoundError as exc:
        raise not_found(exc) from exc
    except ServiceOrderConflictError as exc:
        raise conflict(exc) from exc

    return ServiceOrderPublic(
        **order_to_data(order)
    )


@router.get(
    "/service-orders/{order_id}",
    response_model=ServiceOrderPublic,
)
def get_service_order_detail(
    order_id: UUID,
    database: Database,
    _context: CommerceManager,
) -> ServiceOrderPublic:
    try:
        order = get_order(
            database,
            order_id,
        )
    except ServiceOrderNotFoundError as exc:
        raise not_found(exc) from exc

    return ServiceOrderPublic(
        **order_to_data(order)
    )


@router.patch(
    "/service-orders/{order_id}",
    response_model=ServiceOrderPublic,
)
def patch_service_order(
    order_id: UUID,
    payload: ServiceOrderUpdate,
    database: Database,
    context: CommerceManager,
) -> ServiceOrderPublic:
    try:
        order = update_order(
            database,
            order_id,
            payload,
            context.user.id,
        )
    except ServiceOrderNotFoundError as exc:
        raise not_found(exc) from exc
    except ServiceOrderConflictError as exc:
        raise conflict(exc) from exc

    return ServiceOrderPublic(
        **order_to_data(order)
    )


@router.post(
    (
        "/service-orders/{order_id}"
        "/items/services"
    ),
    response_model=ServiceOrderPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_service_order_service_item(
    order_id: UUID,
    payload: ServiceOrderServiceItemCreate,
    database: Database,
    context: CommerceManager,
) -> ServiceOrderPublic:
    try:
        order = add_service_item(
            database,
            order_id,
            payload,
            context.user.id,
        )
    except ServiceOrderNotFoundError as exc:
        raise not_found(exc) from exc
    except ServiceOrderConflictError as exc:
        raise conflict(exc) from exc

    return ServiceOrderPublic(
        **order_to_data(order)
    )


@router.post(
    (
        "/service-orders/{order_id}"
        "/items/products"
    ),
    response_model=ServiceOrderPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_service_order_product_item(
    order_id: UUID,
    payload: ServiceOrderProductItemCreate,
    database: Database,
    context: CommerceManager,
) -> ServiceOrderPublic:
    try:
        order = add_product_item(
            database,
            order_id,
            payload,
            context.user.id,
        )
    except ServiceOrderNotFoundError as exc:
        raise not_found(exc) from exc
    except ServiceOrderConflictError as exc:
        raise conflict(exc) from exc

    return ServiceOrderPublic(
        **order_to_data(order)
    )


@router.delete(
    (
        "/service-orders/{order_id}"
        "/items/{item_id}"
    ),
    response_model=ServiceOrderPublic,
)
def delete_service_order_item(
    order_id: UUID,
    item_id: UUID,
    database: Database,
    context: CommerceManager,
) -> ServiceOrderPublic:
    try:
        order = remove_item(
            database,
            order_id,
            item_id,
            context.user.id,
        )
    except ServiceOrderNotFoundError as exc:
        raise not_found(exc) from exc
    except ServiceOrderConflictError as exc:
        raise conflict(exc) from exc

    return ServiceOrderPublic(
        **order_to_data(order)
    )


@router.post(
    "/service-orders/{order_id}/close",
    response_model=ServiceOrderPublic,
)
def post_service_order_close(
    order_id: UUID,
    payload: ServiceOrderClose,
    database: Database,
    context: CommerceManager,
) -> ServiceOrderPublic:
    try:
        order = close_order(
            database,
            order_id,
            payload,
            context.user.id,
        )
    except ServiceOrderNotFoundError as exc:
        raise not_found(exc) from exc
    except ServiceOrderConflictError as exc:
        raise conflict(exc) from exc

    return ServiceOrderPublic(
        **order_to_data(order)
    )


@router.post(
    "/service-orders/{order_id}/cancel",
    response_model=ServiceOrderPublic,
)
def post_service_order_cancel(
    order_id: UUID,
    payload: ServiceOrderCancel,
    database: Database,
    context: CommerceManager,
) -> ServiceOrderPublic:
    try:
        order = cancel_order(
            database,
            order_id,
            payload,
            context.user.id,
        )
    except ServiceOrderNotFoundError as exc:
        raise not_found(exc) from exc
    except ServiceOrderConflictError as exc:
        raise conflict(exc) from exc

    return ServiceOrderPublic(
        **order_to_data(order)
    )
