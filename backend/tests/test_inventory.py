from uuid import UUID

from app.models import (
    AuditLog,
    Permission,
    Product,
    Role,
    RolePermission,
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
    email="inventory-admin@example.com",
    role_slug="administrator",
    permission_codes=None,
):
    seed_identity(database)

    if role_slug != "administrator":
        role = Role(
            name="Papel de estoque",
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
        name="Administrador de estoque",
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


def create_supplier(
    client,
    headers,
    *,
    document="12345678000199",
):
    response = client.post(
        "/api/v1/admin/suppliers",
        headers=headers,
        json={
            "legal_name": "Fornecedor Teste Ltda",
            "trade_name": "Fornecedor Teste",
            "document": document,
            "contact_name": "Contato Teste",
            "email": "CONTATO@EXAMPLE.COM",
            "phone": "(83) 99999-0000",
            "active": True,
        },
    )

    assert response.status_code == 201
    return response.json()


def create_product(
    client,
    headers,
    *,
    supplier_id=None,
    sku="PROD-001",
    initial_stock=5,
    minimum_stock=2,
):
    response = client.post(
        "/api/v1/admin/products",
        headers=headers,
        json={
            "supplier_id": supplier_id,
            "name": "Pomada modeladora",
            "sku": sku,
            "barcode": None,
            "description": "Produto para acabamento.",
            "unit_label": "un",
            "cost_cents": 2000,
            "sale_price_cents": 4500,
            "initial_stock": initial_stock,
            "minimum_stock": minimum_stock,
            "active": True,
        },
    )

    assert response.status_code == 201
    return response.json()


def test_inventory_routes_require_auth(
    client,
):
    suppliers = client.get(
        "/api/v1/admin/suppliers"
    )

    products = client.get(
        "/api/v1/admin/products"
    )

    movements = client.get(
        "/api/v1/admin/inventory/movements"
    )

    assert suppliers.status_code == 401
    assert products.status_code == 401
    assert movements.status_code == 401


def test_supplier_lifecycle(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    supplier = create_supplier(
        client,
        headers,
    )

    assert supplier["document"] == (
        "12345678000199"
    )
    assert supplier["email"] == (
        "contato@example.com"
    )
    assert supplier["phone"] == (
        "83999990000"
    )
    assert supplier["product_count"] == 0

    updated = client.patch(
        (
            "/api/v1/admin/suppliers/"
            + supplier["id"]
        ),
        headers=headers,
        json={
            "trade_name": "Novo nome",
            "active": False,
        },
    )

    assert updated.status_code == 200
    assert updated.json()["trade_name"] == (
        "Novo nome"
    )
    assert updated.json()["active"] is False

    listed = client.get(
        (
            "/api/v1/admin/suppliers"
            "?search=Novo"
            "&active=false"
        ),
        headers=headers,
    )

    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_duplicate_supplier_document_rejected(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    first = create_supplier(
        client,
        headers,
    )

    duplicate = client.post(
        "/api/v1/admin/suppliers",
        headers=headers,
        json={
            "legal_name": "Outro fornecedor",
            "document": (
                "12.345.678/0001-99"
            ),
        },
    )

    assert first["document"] == (
        "12345678000199"
    )
    assert duplicate.status_code == 409


def test_product_lifecycle_and_filters(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    supplier = create_supplier(
        client,
        headers,
    )

    product = create_product(
        client,
        headers,
        supplier_id=supplier["id"],
    )

    assert product["sku"] == "PROD-001"
    assert product["stock_quantity"] == 5
    assert product["low_stock"] is False
    assert product["supplier"]["id"] == (
        supplier["id"]
    )

    updated = client.patch(
        (
            "/api/v1/admin/products/"
            + product["id"]
        ),
        headers=headers,
        json={
            "sale_price_cents": 5000,
            "minimum_stock": 6,
        },
    )

    assert updated.status_code == 200
    assert updated.json()[
        "sale_price_cents"
    ] == 5000
    assert updated.json()["low_stock"] is True

    filtered = client.get(
        (
            "/api/v1/admin/products"
            "?search=POMADA"
            "&low_stock=true"
        ),
        headers=headers,
    )

    assert filtered.status_code == 200
    assert len(filtered.json()) == 1


def test_duplicate_product_sku_rejected(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    first = create_product(
        client,
        headers,
        sku="PROD-ABC",
        initial_stock=0,
    )

    duplicate = client.post(
        "/api/v1/admin/products",
        headers=headers,
        json={
            "name": "Produto duplicado",
            "sku": "prod abc",
            "cost_cents": 1000,
            "sale_price_cents": 2000,
            "initial_stock": 0,
            "minimum_stock": 0,
        },
    )

    assert first["sku"] == "PROD-ABC"
    assert duplicate.status_code == 409


def test_stock_entry_and_exit_update_balance(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    supplier = create_supplier(
        client,
        headers,
    )

    product = create_product(
        client,
        headers,
        supplier_id=supplier["id"],
        initial_stock=5,
    )

    entry = client.post(
        "/api/v1/admin/inventory/movements",
        headers=headers,
        json={
            "product_id": product["id"],
            "supplier_id": supplier["id"],
            "movement_type": "entry",
            "quantity": 10,
            "unit_cost_cents": 2200,
            "reason": "Compra de mercadoria",
            "reference": "NF-100",
        },
    )

    assert entry.status_code == 201
    assert entry.json()["quantity_delta"] == 10
    assert entry.json()["stock_before"] == 5
    assert entry.json()["stock_after"] == 15

    exit_response = client.post(
        "/api/v1/admin/inventory/movements",
        headers=headers,
        json={
            "product_id": product["id"],
            "movement_type": "exit",
            "quantity": 4,
            "reason": "Venda no balcão",
            "reference": "VENDA-1",
        },
    )

    assert exit_response.status_code == 201
    assert exit_response.json()[
        "quantity_delta"
    ] == -4
    assert exit_response.json()[
        "stock_after"
    ] == 11

    detail = client.get(
        (
            "/api/v1/admin/products/"
            + product["id"]
        ),
        headers=headers,
    )

    assert detail.status_code == 200
    assert detail.json()[
        "stock_quantity"
    ] == 11
    assert detail.json()["cost_cents"] == 2200


def test_insufficient_stock_is_rejected(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    product = create_product(
        client,
        headers,
        initial_stock=2,
    )

    response = client.post(
        "/api/v1/admin/inventory/movements",
        headers=headers,
        json={
            "product_id": product["id"],
            "movement_type": "exit",
            "quantity": 3,
            "reason": "Saída inválida",
        },
    )

    assert response.status_code == 409

    detail = client.get(
        (
            "/api/v1/admin/products/"
            + product["id"]
        ),
        headers=headers,
    )

    assert detail.json()[
        "stock_quantity"
    ] == 2


def test_adjustment_and_inventory_summary(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    product = create_product(
        client,
        headers,
        initial_stock=5,
        minimum_stock=4,
    )

    adjustment = client.post(
        "/api/v1/admin/inventory/movements",
        headers=headers,
        json={
            "product_id": product["id"],
            "movement_type": "adjustment",
            "quantity": -2,
            "reason": "Avaria identificada",
        },
    )

    assert adjustment.status_code == 201
    assert adjustment.json()[
        "stock_after"
    ] == 3

    summary = client.get(
        "/api/v1/admin/inventory/summary",
        headers=headers,
    )

    assert summary.status_code == 200
    assert summary.json()[
        "total_products"
    ] == 1
    assert summary.json()[
        "low_stock_products"
    ] == 1
    assert summary.json()[
        "total_units"
    ] == 3
    assert summary.json()[
        "inventory_cost_cents"
    ] == 6000
    assert summary.json()[
        "inventory_sale_value_cents"
    ] == 13500


def test_stock_movement_filters(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    product = create_product(
        client,
        headers,
        initial_stock=0,
    )

    entry = client.post(
        "/api/v1/admin/inventory/movements",
        headers=headers,
        json={
            "product_id": product["id"],
            "movement_type": "entry",
            "quantity": 8,
            "reason": "Entrada de teste",
            "reference": "ENTRADA-8",
        },
    )

    assert entry.status_code == 201

    filtered = client.get(
        (
            "/api/v1/admin/inventory/movements"
            "?product_id="
            + product["id"]
            + "&movement_type=entry"
        ),
        headers=headers,
    )

    assert filtered.status_code == 200
    assert len(filtered.json()) == 1
    assert filtered.json()[0][
        "reference"
    ] == "ENTRADA-8"


def test_inventory_audit_events(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
    )

    supplier = create_supplier(
        client,
        headers,
    )

    product = create_product(
        client,
        headers,
        supplier_id=supplier["id"],
        initial_stock=1,
    )

    movement = client.post(
        "/api/v1/admin/inventory/movements",
        headers=headers,
        json={
            "product_id": product["id"],
            "movement_type": "entry",
            "quantity": 2,
            "reason": "Reposição",
        },
    )

    assert movement.status_code == 201

    actions = {
        item.action
        for item in db_session.query(
            AuditLog
        ).all()
    }

    assert (
        "inventory.supplier_created"
        in actions
    )
    assert (
        "inventory.product_created"
        in actions
    )
    assert (
        "inventory.stock_moved"
        in actions
    )


def test_inventory_permission_is_required(
    client,
    db_session,
):
    headers = create_headers(
        client,
        db_session,
        email="limited-inventory@example.com",
        role_slug="limited-inventory",
        permission_codes=[
            "admin.access",
        ],
    )

    response = client.get(
        "/api/v1/admin/products",
        headers=headers,
    )

    assert response.status_code == 403

    assert db_session.query(
        Product
    ).count() == 0
