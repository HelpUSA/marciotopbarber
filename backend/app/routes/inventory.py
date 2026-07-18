from datetime import datetime
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
from app.schemas.inventory import (
    InventorySummary,
    ProductCreate,
    ProductPublic,
    ProductUpdate,
    StockMovementCreate,
    StockMovementPublic,
    SupplierCreate,
    SupplierPublic,
    SupplierUpdate,
)
from app.services.inventory_service import (
    InventoryConflictError,
    InventoryNotFoundError,
    create_product,
    create_stock_movement,
    create_supplier,
    get_product,
    get_supplier,
    inventory_summary,
    list_products,
    list_stock_movements,
    list_suppliers,
    movement_to_data,
    product_to_data,
    supplier_to_data,
    update_product,
    update_supplier,
)


router = APIRouter(
    prefix="/api/v1/admin",
    tags=["inventory-commerce"],
)


InventoryManager = Annotated[
    AuthContext,
    Depends(
        require_permission(
            "inventory.manage"
        )
    ),
]


MovementFilter = Literal[
    "entry",
    "exit",
    "adjustment",
]


def not_found(
    exc: InventoryNotFoundError,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=str(exc),
    )


def conflict(
    exc: InventoryConflictError,
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=str(exc),
    )


@router.get(
    "/suppliers",
    response_model=list[SupplierPublic],
)
def get_suppliers(
    database: Database,
    _context: InventoryManager,
    search: Annotated[
        str | None,
        Query(max_length=160),
    ] = None,
    active: bool | None = None,
) -> list[SupplierPublic]:
    return [
        SupplierPublic(
            **supplier_to_data(
                database,
                supplier,
            )
        )
        for supplier in list_suppliers(
            database,
            search=search,
            active=active,
        )
    ]


@router.get(
    "/suppliers/{supplier_id}",
    response_model=SupplierPublic,
)
def get_supplier_detail(
    supplier_id: UUID,
    database: Database,
    _context: InventoryManager,
) -> SupplierPublic:
    try:
        supplier = get_supplier(
            database,
            supplier_id,
        )
    except InventoryNotFoundError as exc:
        raise not_found(exc) from exc

    return SupplierPublic(
        **supplier_to_data(
            database,
            supplier,
        )
    )


@router.post(
    "/suppliers",
    response_model=SupplierPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_supplier(
    payload: SupplierCreate,
    database: Database,
    context: InventoryManager,
) -> SupplierPublic:
    try:
        supplier = create_supplier(
            database,
            payload,
            context.user.id,
        )
    except InventoryConflictError as exc:
        raise conflict(exc) from exc

    return SupplierPublic(
        **supplier_to_data(
            database,
            supplier,
        )
    )


@router.patch(
    "/suppliers/{supplier_id}",
    response_model=SupplierPublic,
)
def patch_supplier(
    supplier_id: UUID,
    payload: SupplierUpdate,
    database: Database,
    context: InventoryManager,
) -> SupplierPublic:
    try:
        supplier = update_supplier(
            database,
            supplier_id,
            payload,
            context.user.id,
        )
    except InventoryNotFoundError as exc:
        raise not_found(exc) from exc
    except InventoryConflictError as exc:
        raise conflict(exc) from exc

    return SupplierPublic(
        **supplier_to_data(
            database,
            supplier,
        )
    )


@router.get(
    "/products",
    response_model=list[ProductPublic],
)
def get_products(
    database: Database,
    _context: InventoryManager,
    search: Annotated[
        str | None,
        Query(max_length=160),
    ] = None,
    active: bool | None = None,
    supplier_id: UUID | None = None,
    low_stock: bool | None = None,
) -> list[ProductPublic]:
    return [
        ProductPublic(
            **product_to_data(product)
        )
        for product in list_products(
            database,
            search=search,
            active=active,
            supplier_id=supplier_id,
            low_stock=low_stock,
        )
    ]


@router.get(
    "/products/{product_id}",
    response_model=ProductPublic,
)
def get_product_detail(
    product_id: UUID,
    database: Database,
    _context: InventoryManager,
) -> ProductPublic:
    try:
        product = get_product(
            database,
            product_id,
        )
    except InventoryNotFoundError as exc:
        raise not_found(exc) from exc

    return ProductPublic(
        **product_to_data(product)
    )


@router.post(
    "/products",
    response_model=ProductPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_product(
    payload: ProductCreate,
    database: Database,
    context: InventoryManager,
) -> ProductPublic:
    try:
        product = create_product(
            database,
            payload,
            context.user.id,
        )
    except InventoryNotFoundError as exc:
        raise not_found(exc) from exc
    except InventoryConflictError as exc:
        raise conflict(exc) from exc

    return ProductPublic(
        **product_to_data(product)
    )


@router.patch(
    "/products/{product_id}",
    response_model=ProductPublic,
)
def patch_product(
    product_id: UUID,
    payload: ProductUpdate,
    database: Database,
    context: InventoryManager,
) -> ProductPublic:
    try:
        product = update_product(
            database,
            product_id,
            payload,
            context.user.id,
        )
    except InventoryNotFoundError as exc:
        raise not_found(exc) from exc
    except InventoryConflictError as exc:
        raise conflict(exc) from exc

    return ProductPublic(
        **product_to_data(product)
    )


@router.get(
    "/inventory/summary",
    response_model=InventorySummary,
)
def get_inventory_summary(
    database: Database,
    _context: InventoryManager,
) -> InventorySummary:
    return InventorySummary(
        **inventory_summary(database)
    )


@router.get(
    "/inventory/movements",
    response_model=list[
        StockMovementPublic
    ],
)
def get_inventory_movements(
    database: Database,
    _context: InventoryManager,
    product_id: UUID | None = None,
    supplier_id: UUID | None = None,
    movement_type: MovementFilter | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: Annotated[
        int,
        Query(ge=1, le=500),
    ] = 200,
) -> list[StockMovementPublic]:
    return [
        StockMovementPublic(
            **movement_to_data(movement)
        )
        for movement in list_stock_movements(
            database,
            product_id=product_id,
            supplier_id=supplier_id,
            movement_type=movement_type,
            date_from=date_from,
            date_to=date_to,
            limit=limit,
        )
    ]


@router.post(
    "/inventory/movements",
    response_model=StockMovementPublic,
    status_code=status.HTTP_201_CREATED,
)
def post_inventory_movement(
    payload: StockMovementCreate,
    database: Database,
    context: InventoryManager,
) -> StockMovementPublic:
    try:
        movement = create_stock_movement(
            database,
            payload,
            context.user.id,
        )
    except InventoryNotFoundError as exc:
        raise not_found(exc) from exc
    except InventoryConflictError as exc:
        raise conflict(exc) from exc

    return StockMovementPublic(
        **movement_to_data(movement)
    )
