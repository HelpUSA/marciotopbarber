from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    and_,
    func,
    or_,
    select,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (
    Session,
    joinedload,
)

from app.models import (
    AuditLog,
    Product,
    StockMovement,
    Supplier,
)
from app.schemas.inventory import (
    ProductCreate,
    ProductUpdate,
    StockMovementCreate,
    SupplierCreate,
    SupplierUpdate,
)


class InventoryNotFoundError(RuntimeError):
    pass


class InventoryConflictError(RuntimeError):
    pass


def normalize_email(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = value.strip().lower()
    return normalized or None


def add_audit_log(
    database: Session,
    *,
    actor_user_id: UUID,
    action: str,
    entity_type: str,
    entity_id: UUID,
    details: dict | None = None,
) -> None:
    database.add(
        AuditLog(
            user_id=actor_user_id,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details,
        )
    )


def commit_changes(
    database: Session,
    conflict_message: str,
) -> None:
    try:
        database.commit()
    except IntegrityError as exc:
        database.rollback()

        raise InventoryConflictError(
            conflict_message
        ) from exc


def get_supplier(
    database: Session,
    supplier_id: UUID,
) -> Supplier:
    supplier = database.get(
        Supplier,
        supplier_id,
    )

    if supplier is None:
        raise InventoryNotFoundError(
            "Fornecedor não encontrado."
        )

    return supplier


def get_product(
    database: Session,
    product_id: UUID,
    *,
    lock: bool = False,
) -> Product:
    statement = (
        select(Product)
        .options(
            joinedload(Product.supplier)
        )
        .where(
            Product.id == product_id
        )
    )

    if lock:
        statement = statement.with_for_update()

    product = database.scalar(statement)

    if product is None:
        raise InventoryNotFoundError(
            "Produto não encontrado."
        )

    return product


def get_movement(
    database: Session,
    movement_id: UUID,
) -> StockMovement:
    movement = database.scalar(
        select(StockMovement)
        .options(
            joinedload(
                StockMovement.product
            ),
            joinedload(
                StockMovement.supplier
            ),
        )
        .where(
            StockMovement.id == movement_id
        )
    )

    if movement is None:
        raise InventoryNotFoundError(
            "Movimentação não encontrada."
        )

    return movement


def ensure_supplier_document_available(
    database: Session,
    document: str | None,
    supplier_id: UUID | None = None,
) -> None:
    if document is None:
        return

    statement = select(Supplier).where(
        Supplier.document == document
    )

    if supplier_id is not None:
        statement = statement.where(
            Supplier.id != supplier_id
        )

    if database.scalar(statement) is not None:
        raise InventoryConflictError(
            (
                "Já existe um fornecedor "
                "com esse documento."
            )
        )


def ensure_product_sku_available(
    database: Session,
    sku: str,
    product_id: UUID | None = None,
) -> None:
    statement = select(Product).where(
        Product.sku == sku
    )

    if product_id is not None:
        statement = statement.where(
            Product.id != product_id
        )

    if database.scalar(statement) is not None:
        raise InventoryConflictError(
            "Já existe um produto com esse SKU."
        )


def ensure_product_barcode_available(
    database: Session,
    barcode: str | None,
    product_id: UUID | None = None,
) -> None:
    if barcode is None:
        return

    statement = select(Product).where(
        Product.barcode == barcode
    )

    if product_id is not None:
        statement = statement.where(
            Product.id != product_id
        )

    if database.scalar(statement) is not None:
        raise InventoryConflictError(
            (
                "Já existe um produto "
                "com esse código de barras."
            )
        )


def supplier_to_data(
    database: Session,
    supplier: Supplier,
) -> dict:
    product_count = database.scalar(
        select(
            func.count(Product.id)
        ).where(
            Product.supplier_id
            == supplier.id
        )
    )

    return {
        "id": supplier.id,
        "legal_name": supplier.legal_name,
        "trade_name": supplier.trade_name,
        "document": supplier.document,
        "contact_name": supplier.contact_name,
        "email": supplier.email,
        "phone": supplier.phone,
        "address": supplier.address,
        "notes": supplier.notes,
        "active": supplier.active,
        "product_count": int(
            product_count or 0
        ),
        "created_at": supplier.created_at,
        "updated_at": supplier.updated_at,
    }


def supplier_summary(
    supplier: Supplier | None,
) -> dict | None:
    if supplier is None:
        return None

    return {
        "id": supplier.id,
        "legal_name": supplier.legal_name,
        "trade_name": supplier.trade_name,
        "active": supplier.active,
    }


def product_summary(
    product: Product,
) -> dict:
    return {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "unit_label": product.unit_label,
    }


def product_to_data(
    product: Product,
) -> dict:
    return {
        "id": product.id,
        "supplier_id": product.supplier_id,
        "supplier": supplier_summary(
            product.supplier
        ),
        "name": product.name,
        "sku": product.sku,
        "barcode": product.barcode,
        "description": product.description,
        "unit_label": product.unit_label,
        "cost_cents": product.cost_cents,
        "sale_price_cents": (
            product.sale_price_cents
        ),
        "stock_quantity": (
            product.stock_quantity
        ),
        "minimum_stock": product.minimum_stock,
        "low_stock": (
            product.stock_quantity
            <= product.minimum_stock
        ),
        "active": product.active,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


def movement_to_data(
    movement: StockMovement,
) -> dict:
    return {
        "id": movement.id,
        "product_id": movement.product_id,
        "product": product_summary(
            movement.product
        ),
        "supplier_id": movement.supplier_id,
        "supplier": supplier_summary(
            movement.supplier
        ),
        "movement_type": (
            movement.movement_type
        ),
        "quantity_delta": (
            movement.quantity_delta
        ),
        "stock_before": movement.stock_before,
        "stock_after": movement.stock_after,
        "unit_cost_cents": (
            movement.unit_cost_cents
        ),
        "reason": movement.reason,
        "reference": movement.reference,
        "occurred_at": movement.occurred_at,
        "created_at": movement.created_at,
    }


def list_suppliers(
    database: Session,
    *,
    search: str | None = None,
    active: bool | None = None,
) -> list[Supplier]:
    statement = select(Supplier).order_by(
        Supplier.legal_name
    )

    if active is not None:
        statement = statement.where(
            Supplier.active.is_(active)
        )

    if search:
        term = (
            "%"
            + search.strip().lower()
            + "%"
        )

        statement = statement.where(
            or_(
                func.lower(
                    Supplier.legal_name
                ).like(term),
                func.lower(
                    func.coalesce(
                        Supplier.trade_name,
                        "",
                    )
                ).like(term),
                func.lower(
                    func.coalesce(
                        Supplier.email,
                        "",
                    )
                ).like(term),
                func.coalesce(
                    Supplier.document,
                    "",
                ).like(term),
                func.coalesce(
                    Supplier.phone,
                    "",
                ).like(term),
            )
        )

    return list(
        database.scalars(statement).all()
    )


def create_supplier(
    database: Session,
    payload: SupplierCreate,
    actor_user_id: UUID,
) -> Supplier:
    ensure_supplier_document_available(
        database,
        payload.document,
    )

    supplier = Supplier(
        legal_name=payload.legal_name,
        trade_name=payload.trade_name,
        document=payload.document,
        contact_name=payload.contact_name,
        email=normalize_email(
            str(payload.email)
            if payload.email
            else None
        ),
        phone=payload.phone,
        address=payload.address,
        notes=payload.notes,
        active=payload.active,
    )

    database.add(supplier)
    database.flush()

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="inventory.supplier_created",
        entity_type="supplier",
        entity_id=supplier.id,
        details={
            "document": supplier.document,
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível criar "
            "o fornecedor."
        ),
    )

    database.refresh(supplier)
    return supplier


def update_supplier(
    database: Session,
    supplier_id: UUID,
    payload: SupplierUpdate,
    actor_user_id: UUID,
) -> Supplier:
    supplier = get_supplier(
        database,
        supplier_id,
    )

    changed_fields: list[str] = []

    if "legal_name" in payload.model_fields_set:
        if payload.legal_name is None:
            raise InventoryConflictError(
                (
                    "A razão social não pode "
                    "ser vazia."
                )
            )

        supplier.legal_name = payload.legal_name
        changed_fields.append("legal_name")

    if "document" in payload.model_fields_set:
        ensure_supplier_document_available(
            database,
            payload.document,
            supplier.id,
        )

        supplier.document = payload.document
        changed_fields.append("document")

    if "email" in payload.model_fields_set:
        supplier.email = normalize_email(
            str(payload.email)
            if payload.email
            else None
        )

        changed_fields.append("email")

    for field_name in (
        "trade_name",
        "contact_name",
        "phone",
        "address",
        "notes",
        "active",
    ):
        if field_name not in payload.model_fields_set:
            continue

        value = getattr(
            payload,
            field_name,
        )

        if (
            field_name == "active"
            and value is None
        ):
            raise InventoryConflictError(
                "active não pode ser vazio."
            )

        setattr(
            supplier,
            field_name,
            value,
        )

        changed_fields.append(field_name)

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="inventory.supplier_updated",
        entity_type="supplier",
        entity_id=supplier.id,
        details={
            "fields": sorted(
                changed_fields
            ),
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível atualizar "
            "o fornecedor."
        ),
    )

    database.refresh(supplier)
    return supplier


def list_products(
    database: Session,
    *,
    search: str | None = None,
    active: bool | None = None,
    supplier_id: UUID | None = None,
    low_stock: bool | None = None,
) -> list[Product]:
    statement = (
        select(Product)
        .options(
            joinedload(Product.supplier)
        )
        .order_by(Product.name)
    )

    if active is not None:
        statement = statement.where(
            Product.active.is_(active)
        )

    if supplier_id is not None:
        statement = statement.where(
            Product.supplier_id
            == supplier_id
        )

    if low_stock is True:
        statement = statement.where(
            Product.stock_quantity
            <= Product.minimum_stock
        )

    if low_stock is False:
        statement = statement.where(
            Product.stock_quantity
            > Product.minimum_stock
        )

    if search:
        term = (
            "%"
            + search.strip().lower()
            + "%"
        )

        statement = statement.where(
            or_(
                func.lower(
                    Product.name
                ).like(term),
                func.lower(
                    Product.sku
                ).like(term),
                func.lower(
                    func.coalesce(
                        Product.barcode,
                        "",
                    )
                ).like(term),
                func.lower(
                    func.coalesce(
                        Product.description,
                        "",
                    )
                ).like(term),
            )
        )

    return list(
        database.scalars(statement).all()
    )


def resolve_supplier(
    database: Session,
    supplier_id: UUID | None,
) -> Supplier | None:
    if supplier_id is None:
        return None

    return get_supplier(
        database,
        supplier_id,
    )


def create_product(
    database: Session,
    payload: ProductCreate,
    actor_user_id: UUID,
) -> Product:
    ensure_product_sku_available(
        database,
        payload.sku,
    )

    ensure_product_barcode_available(
        database,
        payload.barcode,
    )

    supplier = resolve_supplier(
        database,
        payload.supplier_id,
    )

    product = Product(
        supplier=supplier,
        name=payload.name,
        sku=payload.sku,
        barcode=payload.barcode,
        description=payload.description,
        unit_label=payload.unit_label,
        cost_cents=payload.cost_cents,
        sale_price_cents=(
            payload.sale_price_cents
        ),
        stock_quantity=payload.initial_stock,
        minimum_stock=payload.minimum_stock,
        active=payload.active,
    )

    database.add(product)
    database.flush()

    if payload.initial_stock > 0:
        database.add(
            StockMovement(
                product_id=product.id,
                supplier_id=product.supplier_id,
                user_id=actor_user_id,
                movement_type="adjustment",
                quantity_delta=(
                    payload.initial_stock
                ),
                stock_before=0,
                stock_after=(
                    payload.initial_stock
                ),
                unit_cost_cents=(
                    payload.cost_cents
                ),
                reason="Estoque inicial",
                reference=None,
            )
        )

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="inventory.product_created",
        entity_type="product",
        entity_id=product.id,
        details={
            "sku": product.sku,
            "initial_stock": (
                payload.initial_stock
            ),
        },
    )

    commit_changes(
        database,
        "Não foi possível criar o produto.",
    )

    return get_product(
        database,
        product.id,
    )


def update_product(
    database: Session,
    product_id: UUID,
    payload: ProductUpdate,
    actor_user_id: UUID,
) -> Product:
    product = get_product(
        database,
        product_id,
    )

    changed_fields: list[str] = []

    if "supplier_id" in payload.model_fields_set:
        product.supplier = resolve_supplier(
            database,
            payload.supplier_id,
        )

        changed_fields.append("supplier_id")

    if "name" in payload.model_fields_set:
        if payload.name is None:
            raise InventoryConflictError(
                (
                    "O nome do produto "
                    "não pode ser vazio."
                )
            )

        product.name = payload.name
        changed_fields.append("name")

    if "sku" in payload.model_fields_set:
        if payload.sku is None:
            raise InventoryConflictError(
                "O SKU não pode ser vazio."
            )

        ensure_product_sku_available(
            database,
            payload.sku,
            product.id,
        )

        product.sku = payload.sku
        changed_fields.append("sku")

    if "barcode" in payload.model_fields_set:
        ensure_product_barcode_available(
            database,
            payload.barcode,
            product.id,
        )

        product.barcode = payload.barcode
        changed_fields.append("barcode")

    for field_name in (
        "description",
        "unit_label",
        "cost_cents",
        "sale_price_cents",
        "minimum_stock",
        "active",
    ):
        if field_name not in payload.model_fields_set:
            continue

        value = getattr(
            payload,
            field_name,
        )

        if (
            field_name
            in {
                "unit_label",
                "cost_cents",
                "sale_price_cents",
                "minimum_stock",
                "active",
            }
            and value is None
        ):
            raise InventoryConflictError(
                (
                    field_name
                    + " não pode ser vazio."
                )
            )

        setattr(
            product,
            field_name,
            value,
        )

        changed_fields.append(field_name)

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="inventory.product_updated",
        entity_type="product",
        entity_id=product.id,
        details={
            "fields": sorted(
                changed_fields
            ),
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível atualizar "
            "o produto."
        ),
    )

    return get_product(
        database,
        product.id,
    )


def create_stock_movement(
    database: Session,
    payload: StockMovementCreate,
    actor_user_id: UUID,
) -> StockMovement:
    product = get_product(
        database,
        payload.product_id,
        lock=True,
    )

    supplier = resolve_supplier(
        database,
        payload.supplier_id,
    )

    if payload.movement_type == "entry":
        quantity_delta = abs(
            payload.quantity
        )
    elif payload.movement_type == "exit":
        quantity_delta = -abs(
            payload.quantity
        )
    else:
        quantity_delta = payload.quantity

    stock_before = product.stock_quantity
    stock_after = (
        stock_before + quantity_delta
    )

    if stock_after < 0:
        raise InventoryConflictError(
            (
                "Estoque insuficiente para "
                "realizar a saída."
            )
        )

    if (
        payload.movement_type == "entry"
        and payload.unit_cost_cents is not None
    ):
        product.cost_cents = (
            payload.unit_cost_cents
        )

    product.stock_quantity = stock_after

    movement = StockMovement(
        product=product,
        supplier=(
            supplier
            if supplier is not None
            else (
                product.supplier
                if payload.movement_type
                == "entry"
                else None
            )
        ),
        user_id=actor_user_id,
        movement_type=payload.movement_type,
        quantity_delta=quantity_delta,
        stock_before=stock_before,
        stock_after=stock_after,
        unit_cost_cents=(
            payload.unit_cost_cents
        ),
        reason=payload.reason,
        reference=payload.reference,
    )

    database.add(movement)
    database.flush()

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="inventory.stock_moved",
        entity_type="stock_movement",
        entity_id=movement.id,
        details={
            "product_id": str(product.id),
            "movement_type": (
                movement.movement_type
            ),
            "quantity_delta": (
                movement.quantity_delta
            ),
            "stock_before": (
                movement.stock_before
            ),
            "stock_after": (
                movement.stock_after
            ),
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível registrar "
            "a movimentação."
        ),
    )

    return get_movement(
        database,
        movement.id,
    )


def list_stock_movements(
    database: Session,
    *,
    product_id: UUID | None = None,
    supplier_id: UUID | None = None,
    movement_type: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int = 200,
) -> list[StockMovement]:
    statement = (
        select(StockMovement)
        .options(
            joinedload(
                StockMovement.product
            ),
            joinedload(
                StockMovement.supplier
            ),
        )
        .order_by(
            StockMovement.occurred_at.desc(),
            StockMovement.created_at.desc(),
        )
        .limit(limit)
    )

    if product_id is not None:
        statement = statement.where(
            StockMovement.product_id
            == product_id
        )

    if supplier_id is not None:
        statement = statement.where(
            StockMovement.supplier_id
            == supplier_id
        )

    if movement_type is not None:
        statement = statement.where(
            StockMovement.movement_type
            == movement_type
        )

    if date_from is not None:
        statement = statement.where(
            StockMovement.occurred_at
            >= date_from
        )

    if date_to is not None:
        statement = statement.where(
            StockMovement.occurred_at
            <= date_to
        )

    return list(
        database.scalars(statement).all()
    )


def inventory_summary(
    database: Session,
) -> dict:
    total_products = database.scalar(
        select(func.count(Product.id))
    )

    active_products = database.scalar(
        select(
            func.count(Product.id)
        ).where(
            Product.active.is_(True)
        )
    )

    low_stock_products = database.scalar(
        select(
            func.count(Product.id)
        ).where(
            and_(
                Product.active.is_(True),
                Product.stock_quantity
                <= Product.minimum_stock,
            )
        )
    )

    out_of_stock_products = database.scalar(
        select(
            func.count(Product.id)
        ).where(
            and_(
                Product.active.is_(True),
                Product.stock_quantity == 0,
            )
        )
    )

    total_units = database.scalar(
        select(
            func.coalesce(
                func.sum(
                    Product.stock_quantity
                ),
                0,
            )
        )
    )

    inventory_cost_cents = database.scalar(
        select(
            func.coalesce(
                func.sum(
                    Product.stock_quantity
                    * Product.cost_cents
                ),
                0,
            )
        )
    )

    inventory_sale_value_cents = database.scalar(
        select(
            func.coalesce(
                func.sum(
                    Product.stock_quantity
                    * Product.sale_price_cents
                ),
                0,
            )
        )
    )

    return {
        "total_products": int(
            total_products or 0
        ),
        "active_products": int(
            active_products or 0
        ),
        "low_stock_products": int(
            low_stock_products or 0
        ),
        "out_of_stock_products": int(
            out_of_stock_products or 0
        ),
        "total_units": int(
            total_units or 0
        ),
        "inventory_cost_cents": int(
            inventory_cost_cents or 0
        ),
        "inventory_sale_value_cents": int(
            inventory_sale_value_cents or 0
        ),
    }
