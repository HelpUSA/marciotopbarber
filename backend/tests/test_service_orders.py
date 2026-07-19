from datetime import UTC, datetime
from uuid import UUID

from app.models import (
    Appointment,
    AuditLog,
    Barber,
    Customer,
    Permission,
    Product,
    Role,
    RolePermission,
    Service,
    ServiceOrder,
    ServiceOrderItem,
    ServiceOrderPayment,
    StockMovement,
)
from app.services.identity_service import (
    create_user,
    seed_identity,
)


PASSWORD = "SenhaMuitoForte123"


def create_headers(
    client,
    database,
    *,
    email="commerce-admin@example.com",
    role_slug="administrator",
    permission_codes=None,
):
    seed_identity(database)

    if role_slug != "administrator":
        role = Role(
            name="Papel comercial",
            slug=role_slug,
            active=True,
        )

        for code in permission_codes or []:
            permission = database.query(
                Permission
            ).filter_by(
                code=code
            ).one()

            role.permission_links.append(
                RolePermission(
                    permission=permission
                )
            )

        database.add(role)
        database.commit()

    create_user(
        database,
        name="Administrador comercial",
        email=email,
        password=PASSWORD,
        role_slugs=[role_slug],
    )

    login = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": PASSWORD,
        },
    )

    assert login.status_code == 200

    return {
        "Authorization": (
            "Bearer "
            + login.json()["access_token"]
        )
    }


def seed_commerce(database):
    customer = Customer(
        name="Cliente da Comanda",
        email="cliente-comanda@example.com",
        phone="83999990000",
        active=True,
    )

    barber = Barber(
        name="Barbeiro da Comanda",
        slug="barbeiro-comanda",
        active=True,
    )

    service = Service(
        name="Corte comercial",
        slug="corte-comercial",
        duration_minutes=45,
        price_cents=5000,
        active=True,
    )

    product = Product(
        name="Pomada comercial",
        sku="COMANDA-PROD-001",
        barcode=None,
        unit_label="un",
        cost_cents=2000,
        sale_price_cents=3000,
        stock_quantity=5,
        minimum_stock=1,
        active=True,
    )

    database.add_all([
        customer,
        barber,
        service,
        product,
    ])

    database.commit()

    return (
        customer,
        barber,
        service,
        product,
    )


def create_appointment(
    database,
    customer,
    barber,
    service,
):
    appointment = Appointment(
        customer=customer,
        barber=barber,
        service=service,
        starts_at=datetime(
            2035,
            8,
            10,
            14,
            0,
            tzinfo=UTC,
        ),
        status="confirmed",
    )

    database.add(appointment)
    database.commit()

    return appointment


def open_order(
    client,
    headers,
    *,
    customer_id=None,
    appointment_id=None,
    notes=None,
):
    response = client.post(
        "/api/v1/admin/service-orders",
        headers=headers,
        json={
            "customer_id": customer_id,
            "appointment_id": appointment_id,
            "notes": notes,
            "discount_cents": 0,
        },
    )

    assert response.status_code == 201
    return response.json()


def add_service(
    client,
    headers,
    order_id,
    service_id,
    *,
    barber_id=None,
    quantity=1,
    unit_price_cents=None,
):
    response = client.post(
        (
            f"/api/v1/admin/service-orders/"
            f"{order_id}/items/services"
        ),
        headers=headers,
        json={
            "service_id": str(service_id),
            "barber_id": (
                str(barber_id)
                if barber_id is not None
                else None
            ),
            "quantity": quantity,
            "unit_price_cents": (
                unit_price_cents
            ),
        },
    )

    assert response.status_code == 201
    return response.json()


def add_product(
    client,
    headers,
    order_id,
    product_id,
    *,
    quantity=1,
    unit_price_cents=None,
):
    return client.post(
        (
            f"/api/v1/admin/service-orders/"
            f"{order_id}/items/products"
        ),
        headers=headers,
        json={
            "product_id": str(product_id),
            "quantity": quantity,
            "unit_price_cents": (
                unit_price_cents
            ),
        },
    )


def test_service_orders_require_auth(
    client,
):
    orders = client.get(
        "/api/v1/admin/service-orders"
    )

    summary = client.get(
        (
            "/api/v1/admin/"
            "service-orders/summary"
        )
    )

    assert orders.status_code == 401
    assert summary.status_code == 401


def test_commerce_permission_is_required(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
        email="limited-commerce@example.com",
        role_slug="limited-commerce",
        permission_codes=[
            "admin.access",
        ],
    )

    response = client.get(
        "/api/v1/admin/service-orders",
        headers=headers,
    )

    assert response.status_code == 403


def test_create_list_and_update_order(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    customer, _, _, _ = seed_commerce(
        db_session
    )

    order = open_order(
        client,
        headers,
        customer_id=str(customer.id),
        notes="Atendimento inicial",
    )

    assert order["number"] == 1
    assert order["status"] == "open"
    assert order["customer"]["name"] == (
        "Cliente da Comanda"
    )

    updated = client.patch(
        (
            "/api/v1/admin/service-orders/"
            + order["id"]
        ),
        headers=headers,
        json={
            "notes": "Observação atualizada",
            "discount_cents": 500,
        },
    )

    assert updated.status_code == 200
    assert updated.json()["notes"] == (
        "Observação atualizada"
    )
    assert updated.json()[
        "discount_cents"
    ] == 500

    listed = client.get(
        (
            "/api/v1/admin/service-orders"
            "?search=Cliente"
            "&status=open"
        ),
        headers=headers,
    )

    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_appointment_can_have_only_one_order(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    customer, barber, service, _ = (
        seed_commerce(db_session)
    )

    appointment = create_appointment(
        db_session,
        customer,
        barber,
        service,
    )

    first = open_order(
        client,
        headers,
        appointment_id=str(
            appointment.id
        ),
    )

    duplicate = client.post(
        "/api/v1/admin/service-orders",
        headers=headers,
        json={
            "appointment_id": str(
                appointment.id
            ),
            "discount_cents": 0,
        },
    )

    assert first["customer_id"] == str(
        customer.id
    )
    assert duplicate.status_code == 409


def test_add_service_item_recalculates_totals(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    customer, barber, service, _ = (
        seed_commerce(db_session)
    )

    order = open_order(
        client,
        headers,
        customer_id=str(customer.id),
    )

    updated = add_service(
        client,
        headers,
        order["id"],
        service.id,
        barber_id=barber.id,
        quantity=2,
    )

    assert updated["item_count"] == 1
    assert updated["subtotal_cents"] == 10000
    assert updated["total_cents"] == 10000

    item = updated["items"][0]

    assert item["item_type"] == "service"
    assert item["quantity"] == 2
    assert item["barber"]["id"] == str(
        barber.id
    )


def test_add_product_deducts_stock(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    customer, _, _, product = (
        seed_commerce(db_session)
    )

    order = open_order(
        client,
        headers,
        customer_id=str(customer.id),
    )

    response = add_product(
        client,
        headers,
        order["id"],
        product.id,
        quantity=2,
    )

    assert response.status_code == 201

    payload = response.json()

    assert payload["subtotal_cents"] == 6000
    assert payload["items"][0][
        "item_type"
    ] == "product"

    db_session.expire_all()

    stored_product = db_session.get(
        Product,
        product.id,
    )

    assert stored_product.stock_quantity == 3

    movement = db_session.query(
        StockMovement
    ).filter_by(
        reference="COMANDA-1"
    ).one()

    assert movement.quantity_delta == -2
    assert movement.stock_before == 5
    assert movement.stock_after == 3


def test_insufficient_stock_is_rejected(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    customer, _, _, product = (
        seed_commerce(db_session)
    )

    order = open_order(
        client,
        headers,
        customer_id=str(customer.id),
    )

    response = add_product(
        client,
        headers,
        order["id"],
        product.id,
        quantity=6,
    )

    assert response.status_code == 409

    db_session.expire_all()

    stored_product = db_session.get(
        Product,
        product.id,
    )

    assert stored_product.stock_quantity == 5

    assert db_session.query(
        ServiceOrderItem
    ).count() == 0


def test_remove_product_item_restores_stock(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    customer, _, _, product = (
        seed_commerce(db_session)
    )

    order = open_order(
        client,
        headers,
        customer_id=str(customer.id),
    )

    added = add_product(
        client,
        headers,
        order["id"],
        product.id,
        quantity=2,
    )

    assert added.status_code == 201

    item_id = added.json()["items"][0]["id"]

    removed = client.delete(
        (
            f"/api/v1/admin/service-orders/"
            f"{order['id']}/items/{item_id}"
        ),
        headers=headers,
    )

    assert removed.status_code == 200
    assert removed.json()["item_count"] == 0
    assert removed.json()["total_cents"] == 0

    db_session.expire_all()

    stored_product = db_session.get(
        Product,
        product.id,
    )

    assert stored_product.stock_quantity == 5

    movements = db_session.query(
        StockMovement
    ).order_by(
        StockMovement.created_at
    ).all()

    assert len(movements) == 2
    assert movements[-1].quantity_delta == 2


def test_close_order_with_split_payments(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    customer, barber, service, product = (
        seed_commerce(db_session)
    )

    order = open_order(
        client,
        headers,
        customer_id=str(customer.id),
    )

    order = add_service(
        client,
        headers,
        order["id"],
        service.id,
        barber_id=barber.id,
    )

    product_response = add_product(
        client,
        headers,
        order["id"],
        product.id,
        quantity=1,
    )

    assert product_response.status_code == 201
    assert product_response.json()[
        "total_cents"
    ] == 8000

    closed = client.post(
        (
            f"/api/v1/admin/service-orders/"
            f"{order['id']}/close"
        ),
        headers=headers,
        json={
            "payments": [
                {
                    "payment_method": "pix",
                    "amount_cents": 3000,
                    "reference": "PIX-001",
                },
                {
                    "payment_method": "cash",
                    "amount_cents": 5000,
                    "reference": None,
                },
            ]
        },
    )

    assert closed.status_code == 200

    payload = closed.json()

    assert payload["status"] == "closed"
    assert payload["paid_cents"] == 8000
    assert payload["payment_count"] == 2
    assert payload["closed_at"] is not None

    assert db_session.query(
        ServiceOrderPayment
    ).count() == 2

    actions = {
        item.action
        for item in db_session.query(
            AuditLog
        ).all()
    }

    assert "commerce.order_created" in actions
    assert (
        "commerce.service_item_added"
        in actions
    )
    assert (
        "commerce.product_item_added"
        in actions
    )
    assert "commerce.order_closed" in actions


def test_payment_total_mismatch_is_rejected(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    customer, barber, service, _ = (
        seed_commerce(db_session)
    )

    order = open_order(
        client,
        headers,
        customer_id=str(customer.id),
    )

    order = add_service(
        client,
        headers,
        order["id"],
        service.id,
        barber_id=barber.id,
    )

    response = client.post(
        (
            f"/api/v1/admin/service-orders/"
            f"{order['id']}/close"
        ),
        headers=headers,
        json={
            "payments": [
                {
                    "payment_method": "pix",
                    "amount_cents": 4000,
                }
            ]
        },
    )

    assert response.status_code == 409

    db_session.expire_all()

    stored_order = db_session.get(
        ServiceOrder,
        UUID(order["id"]),
    )

    assert stored_order.status == "open"


def test_cancel_restores_stock_and_blocks_changes(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    customer, _, service, product = (
        seed_commerce(db_session)
    )

    order = open_order(
        client,
        headers,
        customer_id=str(customer.id),
    )

    added = add_product(
        client,
        headers,
        order["id"],
        product.id,
        quantity=2,
    )

    assert added.status_code == 201

    cancelled = client.post(
        (
            f"/api/v1/admin/service-orders/"
            f"{order['id']}/cancel"
        ),
        headers=headers,
        json={
            "reason": "Cliente desistiu",
        },
    )

    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == (
        "cancelled"
    )
    assert cancelled.json()[
        "cancellation_reason"
    ] == "Cliente desistiu"

    db_session.expire_all()

    stored_product = db_session.get(
        Product,
        product.id,
    )

    assert stored_product.stock_quantity == 5

    blocked = client.post(
        (
            f"/api/v1/admin/service-orders/"
            f"{order['id']}/items/services"
        ),
        headers=headers,
        json={
            "service_id": str(service.id),
            "quantity": 1,
        },
    )

    assert blocked.status_code == 409


def test_service_orders_summary(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    customer, barber, service, _ = (
        seed_commerce(db_session)
    )

    open_item = open_order(
        client,
        headers,
        customer_id=str(customer.id),
    )

    closed_item = open_order(
        client,
        headers,
        customer_id=str(customer.id),
    )

    closed_item = add_service(
        client,
        headers,
        closed_item["id"],
        service.id,
        barber_id=barber.id,
    )

    closed = client.post(
        (
            f"/api/v1/admin/service-orders/"
            f"{closed_item['id']}/close"
        ),
        headers=headers,
        json={
            "payments": [
                {
                    "payment_method": "pix",
                    "amount_cents": 5000,
                }
            ]
        },
    )

    assert closed.status_code == 200

    cancelled_item = open_order(
        client,
        headers,
        customer_id=str(customer.id),
    )

    cancelled_item = add_service(
        client,
        headers,
        cancelled_item["id"],
        service.id,
        barber_id=barber.id,
    )

    cancelled = client.post(
        (
            f"/api/v1/admin/service-orders/"
            f"{cancelled_item['id']}/cancel"
        ),
        headers=headers,
        json={
            "reason": "Cancelamento de teste",
        },
    )

    assert cancelled.status_code == 200
    assert open_item["status"] == "open"

    summary = client.get(
        (
            "/api/v1/admin/"
            "service-orders/summary"
        ),
        headers=headers,
    )

    assert summary.status_code == 200

    payload = summary.json()

    assert payload["open_orders"] == 1
    assert payload["closed_orders"] == 1
    assert payload["cancelled_orders"] == 1
    assert payload[
        "gross_revenue_cents"
    ] == 5000
    assert payload[
        "average_ticket_cents"
    ] == 5000
