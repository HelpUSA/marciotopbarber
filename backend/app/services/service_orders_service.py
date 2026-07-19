from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import (
    String,
    cast,
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
    Appointment,
    AuditLog,
    Barber,
    Customer,
    Product,
    Service,
    ServiceOrder,
    ServiceOrderItem,
    ServiceOrderPayment,
    StockMovement,
)
from app.schemas.service_orders import (
    ServiceOrderCancel,
    ServiceOrderClose,
    ServiceOrderCreate,
    ServiceOrderProductItemCreate,
    ServiceOrderServiceItemCreate,
    ServiceOrderUpdate,
)


class ServiceOrderNotFoundError(
    RuntimeError
):
    pass


class ServiceOrderConflictError(
    RuntimeError
):
    pass


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


def flush_changes(
    database: Session,
    conflict_message: str,
) -> None:
    try:
        database.flush()
    except IntegrityError as exc:
        database.rollback()

        raise ServiceOrderConflictError(
            conflict_message
        ) from exc


def commit_changes(
    database: Session,
    conflict_message: str,
) -> None:
    try:
        database.commit()
    except IntegrityError as exc:
        database.rollback()

        raise ServiceOrderConflictError(
            conflict_message
        ) from exc


def full_order_statement():
    return (
        select(ServiceOrder)
        .options(
            joinedload(
                ServiceOrder.customer
            ),
            joinedload(
                ServiceOrder.appointment
            ),
            joinedload(
                ServiceOrder.items
            ).joinedload(
                ServiceOrderItem.service
            ),
            joinedload(
                ServiceOrder.items
            ).joinedload(
                ServiceOrderItem.product
            ),
            joinedload(
                ServiceOrder.items
            ).joinedload(
                ServiceOrderItem.barber
            ),
            joinedload(
                ServiceOrder.items
            ).joinedload(
                ServiceOrderItem.stock_movement
            ),
            joinedload(
                ServiceOrder.payments
            ),
        )
    )


def get_order(
    database: Session,
    order_id: UUID,
) -> ServiceOrder:
    result = database.execute(
        full_order_statement().where(
            ServiceOrder.id == order_id
        )
    )

    order = result.unique().scalar_one_or_none()

    if order is None:
        raise ServiceOrderNotFoundError(
            "Comanda não encontrada."
        )

    return order


def get_order_for_update(
    database: Session,
    order_id: UUID,
) -> ServiceOrder:
    order = database.scalar(
        select(ServiceOrder)
        .where(
            ServiceOrder.id == order_id
        )
        .with_for_update()
    )

    if order is None:
        raise ServiceOrderNotFoundError(
            "Comanda não encontrada."
        )

    return order


def ensure_open(
    order: ServiceOrder,
) -> None:
    if order.status != "open":
        raise ServiceOrderConflictError(
            (
                "Somente comandas abertas "
                "podem ser alteradas."
            )
        )


def get_customer(
    database: Session,
    customer_id: UUID | None,
) -> Customer | None:
    if customer_id is None:
        return None

    customer = database.get(
        Customer,
        customer_id,
    )

    if customer is None:
        raise ServiceOrderNotFoundError(
            "Cliente não encontrado."
        )

    return customer


def get_appointment(
    database: Session,
    appointment_id: UUID | None,
) -> Appointment | None:
    if appointment_id is None:
        return None

    appointment = database.get(
        Appointment,
        appointment_id,
    )

    if appointment is None:
        raise ServiceOrderNotFoundError(
            "Agendamento não encontrado."
        )

    return appointment


def ensure_appointment_available(
    database: Session,
    appointment_id: UUID | None,
    order_id: UUID | None = None,
) -> None:
    if appointment_id is None:
        return

    statement = select(ServiceOrder.id).where(
        ServiceOrder.appointment_id
        == appointment_id
    )

    if order_id is not None:
        statement = statement.where(
            ServiceOrder.id != order_id
        )

    if database.scalar(statement) is not None:
        raise ServiceOrderConflictError(
            (
                "O agendamento já possui "
                "uma comanda vinculada."
            )
        )


def get_service(
    database: Session,
    service_id: UUID,
) -> Service:
    service = database.get(
        Service,
        service_id,
    )

    if service is None:
        raise ServiceOrderNotFoundError(
            "Serviço não encontrado."
        )

    if not service.active:
        raise ServiceOrderConflictError(
            "O serviço está inativo."
        )

    return service


def get_barber(
    database: Session,
    barber_id: UUID | None,
) -> Barber | None:
    if barber_id is None:
        return None

    barber = database.get(
        Barber,
        barber_id,
    )

    if barber is None:
        raise ServiceOrderNotFoundError(
            "Barbeiro não encontrado."
        )

    if not barber.active:
        raise ServiceOrderConflictError(
            "O barbeiro está inativo."
        )

    return barber


def get_product_for_update(
    database: Session,
    product_id: UUID,
    *,
    require_active: bool,
) -> Product:
    product = database.scalar(
        select(Product)
        .where(
            Product.id == product_id
        )
        .with_for_update()
    )

    if product is None:
        raise ServiceOrderNotFoundError(
            "Produto não encontrado."
        )

    if require_active and not product.active:
        raise ServiceOrderConflictError(
            "O produto está inativo."
        )

    return product


def get_item(
    database: Session,
    order_id: UUID,
    item_id: UUID,
) -> ServiceOrderItem:
    item = database.scalar(
        select(ServiceOrderItem).where(
            ServiceOrderItem.id == item_id,
            ServiceOrderItem.service_order_id
            == order_id,
        )
    )

    if item is None:
        raise ServiceOrderNotFoundError(
            "Item da comanda não encontrado."
        )

    return item


def next_order_number(
    database: Session,
) -> int:
    current_number = database.scalar(
        select(
            func.max(ServiceOrder.number)
        )
    )

    return int(current_number or 0) + 1


def recalculate_order(
    database: Session,
    order: ServiceOrder,
) -> None:
    flush_changes(
        database,
        (
            "Não foi possível recalcular "
            "a comanda."
        ),
    )

    subtotal = database.scalar(
        select(
            func.coalesce(
                func.sum(
                    ServiceOrderItem.total_cents
                ),
                0,
            )
        ).where(
            ServiceOrderItem.service_order_id
            == order.id
        )
    )

    order.subtotal_cents = int(
        subtotal or 0
    )

    order.total_cents = max(
        0,
        (
            order.subtotal_cents
            - order.discount_cents
        ),
    )


def customer_to_data(
    customer: Customer | None,
) -> dict | None:
    if customer is None:
        return None

    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
    }


def appointment_to_data(
    appointment: Appointment | None,
) -> dict | None:
    if appointment is None:
        return None

    return {
        "id": appointment.id,
        "status": appointment.status,
        "starts_at": appointment.starts_at,
    }


def barber_to_data(
    barber: Barber | None,
) -> dict | None:
    if barber is None:
        return None

    return {
        "id": barber.id,
        "name": barber.name,
    }


def item_to_data(
    item: ServiceOrderItem,
) -> dict:
    return {
        "id": item.id,
        "item_type": item.item_type,
        "service_id": item.service_id,
        "product_id": item.product_id,
        "barber_id": item.barber_id,
        "stock_movement_id": (
            item.stock_movement_id
        ),
        "barber": barber_to_data(
            item.barber
        ),
        "name": item.name,
        "quantity": item.quantity,
        "unit_price_cents": (
            item.unit_price_cents
        ),
        "total_cents": item.total_cents,
        "created_at": item.created_at,
    }


def payment_to_data(
    payment: ServiceOrderPayment,
) -> dict:
    return {
        "id": payment.id,
        "payment_method": (
            payment.payment_method
        ),
        "amount_cents": (
            payment.amount_cents
        ),
        "reference": payment.reference,
        "paid_at": payment.paid_at,
        "created_at": payment.created_at,
    }


def order_to_data(
    order: ServiceOrder,
) -> dict:
    items = sorted(
        order.items,
        key=lambda item: (
            item.created_at,
            str(item.id),
        ),
    )

    payments = sorted(
        order.payments,
        key=lambda payment: (
            payment.paid_at,
            str(payment.id),
        ),
    )

    return {
        "id": order.id,
        "number": order.number,
        "customer_id": order.customer_id,
        "appointment_id": (
            order.appointment_id
        ),
        "customer": customer_to_data(
            order.customer
        ),
        "appointment": appointment_to_data(
            order.appointment
        ),
        "status": order.status,
        "notes": order.notes,
        "cancellation_reason": (
            order.cancellation_reason
        ),
        "subtotal_cents": (
            order.subtotal_cents
        ),
        "discount_cents": (
            order.discount_cents
        ),
        "total_cents": order.total_cents,
        "paid_cents": order.paid_cents,
        "item_count": len(items),
        "payment_count": len(payments),
        "items": [
            item_to_data(item)
            for item in items
        ],
        "payments": [
            payment_to_data(payment)
            for payment in payments
        ],
        "opened_at": order.opened_at,
        "closed_at": order.closed_at,
        "cancelled_at": order.cancelled_at,
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


def list_orders(
    database: Session,
    *,
    search: str | None = None,
    status: str | None = None,
    customer_id: UUID | None = None,
) -> list[ServiceOrder]:
    statement = (
        full_order_statement()
        .outerjoin(
            Customer,
            ServiceOrder.customer_id
            == Customer.id,
        )
        .order_by(
            ServiceOrder.opened_at.desc(),
            ServiceOrder.number.desc(),
        )
    )

    if status is not None:
        statement = statement.where(
            ServiceOrder.status == status
        )

    if customer_id is not None:
        statement = statement.where(
            ServiceOrder.customer_id
            == customer_id
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
                    cast(
                        ServiceOrder.number,
                        String,
                    )
                ).like(term),
                func.lower(
                    func.coalesce(
                        Customer.name,
                        "",
                    )
                ).like(term),
                func.lower(
                    func.coalesce(
                        Customer.phone,
                        "",
                    )
                ).like(term),
                func.lower(
                    func.coalesce(
                        ServiceOrder.notes,
                        "",
                    )
                ).like(term),
            )
        )

    result = database.execute(statement)

    return list(
        result.unique().scalars().all()
    )


def create_order(
    database: Session,
    payload: ServiceOrderCreate,
    actor_user_id: UUID,
) -> ServiceOrder:
    appointment = get_appointment(
        database,
        payload.appointment_id,
    )

    ensure_appointment_available(
        database,
        payload.appointment_id,
    )

    customer = get_customer(
        database,
        payload.customer_id,
    )

    if appointment is not None:
        if (
            customer is not None
            and customer.id
            != appointment.customer_id
        ):
            raise ServiceOrderConflictError(
                (
                    "O cliente informado não "
                    "corresponde ao agendamento."
                )
            )

        if customer is None:
            customer = get_customer(
                database,
                appointment.customer_id,
            )

    order = ServiceOrder(
        number=next_order_number(database),
        customer=customer,
        appointment=appointment,
        opened_by_user_id=actor_user_id,
        status="open",
        notes=payload.notes,
        discount_cents=(
            payload.discount_cents
        ),
        subtotal_cents=0,
        total_cents=0,
        paid_cents=0,
    )

    database.add(order)

    flush_changes(
        database,
        (
            "Não foi possível criar "
            "a comanda."
        ),
    )

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="commerce.order_created",
        entity_type="service_order",
        entity_id=order.id,
        details={
            "number": order.number,
            "customer_id": (
                str(order.customer_id)
                if order.customer_id
                else None
            ),
            "appointment_id": (
                str(order.appointment_id)
                if order.appointment_id
                else None
            ),
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível criar "
            "a comanda."
        ),
    )

    return get_order(
        database,
        order.id,
    )


def update_order(
    database: Session,
    order_id: UUID,
    payload: ServiceOrderUpdate,
    actor_user_id: UUID,
) -> ServiceOrder:
    order = get_order_for_update(
        database,
        order_id,
    )

    ensure_open(order)

    appointment_changed = (
        "appointment_id"
        in payload.model_fields_set
    )

    customer_changed = (
        "customer_id"
        in payload.model_fields_set
    )

    new_appointment = order.appointment
    new_customer = order.customer

    if appointment_changed:
        new_appointment = get_appointment(
            database,
            payload.appointment_id,
        )

        ensure_appointment_available(
            database,
            payload.appointment_id,
            order.id,
        )

    if customer_changed:
        new_customer = get_customer(
            database,
            payload.customer_id,
        )
    elif (
        appointment_changed
        and new_appointment is not None
    ):
        new_customer = get_customer(
            database,
            new_appointment.customer_id,
        )

    if new_appointment is not None:
        if (
            new_customer is None
            or new_customer.id
            != new_appointment.customer_id
        ):
            raise ServiceOrderConflictError(
                (
                    "O cliente informado não "
                    "corresponde ao agendamento."
                )
            )

    changed_fields: list[str] = []

    if appointment_changed:
        order.appointment = new_appointment
        changed_fields.append(
            "appointment_id"
        )

    if (
        customer_changed
        or (
            appointment_changed
            and new_appointment is not None
        )
    ):
        order.customer = new_customer
        changed_fields.append(
            "customer_id"
        )

    if "notes" in payload.model_fields_set:
        order.notes = payload.notes
        changed_fields.append("notes")

    if (
        "discount_cents"
        in payload.model_fields_set
    ):
        if payload.discount_cents is None:
            raise ServiceOrderConflictError(
                (
                    "O desconto não pode "
                    "ser vazio."
                )
            )

        order.discount_cents = (
            payload.discount_cents
        )

        changed_fields.append(
            "discount_cents"
        )

    recalculate_order(
        database,
        order,
    )

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="commerce.order_updated",
        entity_type="service_order",
        entity_id=order.id,
        details={
            "fields": sorted(
                set(changed_fields)
            ),
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível atualizar "
            "a comanda."
        ),
    )

    return get_order(
        database,
        order.id,
    )


def add_service_item(
    database: Session,
    order_id: UUID,
    payload: ServiceOrderServiceItemCreate,
    actor_user_id: UUID,
) -> ServiceOrder:
    order = get_order_for_update(
        database,
        order_id,
    )

    ensure_open(order)

    service = get_service(
        database,
        payload.service_id,
    )

    barber = get_barber(
        database,
        payload.barber_id,
    )

    unit_price = (
        payload.unit_price_cents
        if payload.unit_price_cents
        is not None
        else service.price_cents
    )

    item = ServiceOrderItem(
        service_order_id=order.id,
        item_type="service",
        service_id=service.id,
        barber_id=(
            barber.id
            if barber is not None
            else None
        ),
        name=service.name,
        quantity=payload.quantity,
        unit_price_cents=unit_price,
        total_cents=(
            unit_price * payload.quantity
        ),
    )

    database.add(item)

    flush_changes(
        database,
        (
            "Não foi possível adicionar "
            "o serviço."
        ),
    )

    recalculate_order(
        database,
        order,
    )

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action=(
            "commerce.service_item_added"
        ),
        entity_type="service_order_item",
        entity_id=item.id,
        details={
            "order_id": str(order.id),
            "service_id": str(service.id),
            "barber_id": (
                str(barber.id)
                if barber
                else None
            ),
            "quantity": item.quantity,
            "total_cents": (
                item.total_cents
            ),
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível adicionar "
            "o serviço."
        ),
    )

    return get_order(
        database,
        order.id,
    )


def add_product_item(
    database: Session,
    order_id: UUID,
    payload: ServiceOrderProductItemCreate,
    actor_user_id: UUID,
) -> ServiceOrder:
    order = get_order_for_update(
        database,
        order_id,
    )

    ensure_open(order)

    product = get_product_for_update(
        database,
        payload.product_id,
        require_active=True,
    )

    if (
        product.stock_quantity
        < payload.quantity
    ):
        raise ServiceOrderConflictError(
            (
                "Estoque insuficiente para "
                "adicionar o produto."
            )
        )

    unit_price = (
        payload.unit_price_cents
        if payload.unit_price_cents
        is not None
        else product.sale_price_cents
    )

    stock_before = product.stock_quantity
    stock_after = (
        stock_before - payload.quantity
    )

    product.stock_quantity = stock_after

    movement = StockMovement(
        product_id=product.id,
        supplier_id=product.supplier_id,
        user_id=actor_user_id,
        movement_type="exit",
        quantity_delta=(
            -payload.quantity
        ),
        stock_before=stock_before,
        stock_after=stock_after,
        unit_cost_cents=(
            product.cost_cents
        ),
        reason=(
            "Venda na comanda "
            f"#{order.number}"
        ),
        reference=(
            f"COMANDA-{order.number}"
        ),
    )

    database.add(movement)

    flush_changes(
        database,
        (
            "Não foi possível registrar "
            "a baixa de estoque."
        ),
    )

    item = ServiceOrderItem(
        service_order_id=order.id,
        item_type="product",
        product_id=product.id,
        stock_movement_id=movement.id,
        name=product.name,
        quantity=payload.quantity,
        unit_price_cents=unit_price,
        total_cents=(
            unit_price * payload.quantity
        ),
    )

    database.add(item)

    flush_changes(
        database,
        (
            "Não foi possível adicionar "
            "o produto."
        ),
    )

    recalculate_order(
        database,
        order,
    )

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action=(
            "commerce.product_item_added"
        ),
        entity_type="service_order_item",
        entity_id=item.id,
        details={
            "order_id": str(order.id),
            "product_id": str(product.id),
            "quantity": item.quantity,
            "stock_before": stock_before,
            "stock_after": stock_after,
            "total_cents": (
                item.total_cents
            ),
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível adicionar "
            "o produto."
        ),
    )

    return get_order(
        database,
        order.id,
    )


def remove_item(
    database: Session,
    order_id: UUID,
    item_id: UUID,
    actor_user_id: UUID,
) -> ServiceOrder:
    order = get_order_for_update(
        database,
        order_id,
    )

    ensure_open(order)

    item = get_item(
        database,
        order_id,
        item_id,
    )

    item_type = item.item_type
    item_name = item.name
    item_quantity = item.quantity

    if (
        item.item_type == "product"
        and item.product_id is not None
    ):
        product = get_product_for_update(
            database,
            item.product_id,
            require_active=False,
        )

        stock_before = product.stock_quantity
        stock_after = (
            stock_before + item.quantity
        )

        product.stock_quantity = stock_after

        database.add(
            StockMovement(
                product_id=product.id,
                supplier_id=(
                    product.supplier_id
                ),
                user_id=actor_user_id,
                movement_type="adjustment",
                quantity_delta=item.quantity,
                stock_before=stock_before,
                stock_after=stock_after,
                unit_cost_cents=(
                    product.cost_cents
                ),
                reason=(
                    "Estorno de item da "
                    f"comanda #{order.number}"
                ),
                reference=(
                    "ESTORNO-COMANDA-"
                    f"{order.number}"
                ),
            )
        )

    database.delete(item)

    flush_changes(
        database,
        (
            "Não foi possível remover "
            "o item."
        ),
    )

    recalculate_order(
        database,
        order,
    )

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="commerce.order_item_removed",
        entity_type="service_order",
        entity_id=order.id,
        details={
            "item_id": str(item_id),
            "item_type": item_type,
            "name": item_name,
            "quantity": item_quantity,
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível remover "
            "o item."
        ),
    )

    return get_order(
        database,
        order.id,
    )


def close_order(
    database: Session,
    order_id: UUID,
    payload: ServiceOrderClose,
    actor_user_id: UUID,
) -> ServiceOrder:
    order = get_order_for_update(
        database,
        order_id,
    )

    ensure_open(order)

    recalculate_order(
        database,
        order,
    )

    item_count = database.scalar(
        select(
            func.count(
                ServiceOrderItem.id
            )
        ).where(
            ServiceOrderItem.service_order_id
            == order.id
        )
    )

    if int(item_count or 0) == 0:
        raise ServiceOrderConflictError(
            (
                "A comanda precisa ter "
                "pelo menos um item."
            )
        )

    if (
        order.discount_cents
        > order.subtotal_cents
    ):
        raise ServiceOrderConflictError(
            (
                "O desconto não pode ser "
                "maior que o subtotal."
            )
        )

    if order.total_cents <= 0:
        raise ServiceOrderConflictError(
            (
                "O total da comanda deve "
                "ser maior que zero."
            )
        )

    payment_total = sum(
        payment.amount_cents
        for payment in payload.payments
    )

    if payment_total != order.total_cents:
        raise ServiceOrderConflictError(
            (
                "A soma dos pagamentos deve "
                "ser igual ao total da comanda."
            )
        )

    for payment_payload in payload.payments:
        database.add(
            ServiceOrderPayment(
                service_order_id=order.id,
                payment_method=(
                    payment_payload.payment_method
                ),
                amount_cents=(
                    payment_payload.amount_cents
                ),
                reference=(
                    payment_payload.reference
                ),
            )
        )

    order.status = "closed"
    order.paid_cents = payment_total
    order.closed_at = datetime.now(UTC)
    order.closed_by_user_id = (
        actor_user_id
    )

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="commerce.order_closed",
        entity_type="service_order",
        entity_id=order.id,
        details={
            "number": order.number,
            "total_cents": (
                order.total_cents
            ),
            "payments": [
                {
                    "method": (
                        payment.payment_method
                    ),
                    "amount_cents": (
                        payment.amount_cents
                    ),
                }
                for payment in payload.payments
            ],
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível fechar "
            "a comanda."
        ),
    )

    return get_order(
        database,
        order.id,
    )


def cancel_order(
    database: Session,
    order_id: UUID,
    payload: ServiceOrderCancel,
    actor_user_id: UUID,
) -> ServiceOrder:
    order = get_order_for_update(
        database,
        order_id,
    )

    ensure_open(order)

    product_items = list(
        database.scalars(
            select(ServiceOrderItem)
            .where(
                ServiceOrderItem.service_order_id
                == order.id,
                ServiceOrderItem.item_type
                == "product",
                ServiceOrderItem.product_id
                .is_not(None),
            )
            .order_by(
                ServiceOrderItem.created_at,
                ServiceOrderItem.id,
            )
        ).all()
    )

    restored_products: list[dict] = []

    for item in product_items:
        if item.product_id is None:
            continue

        product = get_product_for_update(
            database,
            item.product_id,
            require_active=False,
        )

        stock_before = product.stock_quantity
        stock_after = (
            stock_before + item.quantity
        )

        product.stock_quantity = stock_after

        database.add(
            StockMovement(
                product_id=product.id,
                supplier_id=(
                    product.supplier_id
                ),
                user_id=actor_user_id,
                movement_type="adjustment",
                quantity_delta=item.quantity,
                stock_before=stock_before,
                stock_after=stock_after,
                unit_cost_cents=(
                    product.cost_cents
                ),
                reason=(
                    "Cancelamento da "
                    f"comanda #{order.number}"
                ),
                reference=(
                    "CANCELAMENTO-COMANDA-"
                    f"{order.number}"
                ),
            )
        )

        restored_products.append(
            {
                "product_id": str(
                    product.id
                ),
                "quantity": item.quantity,
                "stock_before": stock_before,
                "stock_after": stock_after,
            }
        )

    order.status = "cancelled"
    order.cancellation_reason = (
        payload.reason
    )
    order.cancelled_at = datetime.now(UTC)
    order.paid_cents = 0

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="commerce.order_cancelled",
        entity_type="service_order",
        entity_id=order.id,
        details={
            "number": order.number,
            "reason": payload.reason,
            "restored_products": (
                restored_products
            ),
        },
    )

    commit_changes(
        database,
        (
            "Não foi possível cancelar "
            "a comanda."
        ),
    )

    return get_order(
        database,
        order.id,
    )


def orders_summary(
    database: Session,
) -> dict:
    open_orders = database.scalar(
        select(
            func.count(ServiceOrder.id)
        ).where(
            ServiceOrder.status == "open"
        )
    )

    closed_orders = database.scalar(
        select(
            func.count(ServiceOrder.id)
        ).where(
            ServiceOrder.status == "closed"
        )
    )

    cancelled_orders = database.scalar(
        select(
            func.count(ServiceOrder.id)
        ).where(
            ServiceOrder.status
            == "cancelled"
        )
    )

    gross_revenue = database.scalar(
        select(
            func.coalesce(
                func.sum(
                    ServiceOrder.total_cents
                ),
                0,
            )
        ).where(
            ServiceOrder.status == "closed"
        )
    )

    closed_count = int(
        closed_orders or 0
    )

    gross_value = int(
        gross_revenue or 0
    )

    average_ticket = (
        gross_value // closed_count
        if closed_count > 0
        else 0
    )

    return {
        "open_orders": int(
            open_orders or 0
        ),
        "closed_orders": closed_count,
        "cancelled_orders": int(
            cancelled_orders or 0
        ),
        "gross_revenue_cents": (
            gross_value
        ),
        "average_ticket_cents": (
            average_ticket
        ),
    }
