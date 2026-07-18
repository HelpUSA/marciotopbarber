import re
import unicodedata
from uuid import UUID

from sqlalchemy import (
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
    Customer,
    Service,
    ServiceCategory,
)
from app.schemas.catalog_clients import (
    CustomerCreate,
    CustomerUpdate,
    ServiceCategoryCreate,
    ServiceCategoryUpdate,
    ServiceCreate,
    ServiceUpdate,
)


class CatalogClientsNotFoundError(RuntimeError):
    pass


class CatalogClientsConflictError(RuntimeError):
    pass


def normalize_email(
    email: str | None,
) -> str | None:
    if email is None:
        return None

    normalized = email.strip().lower()
    return normalized or None


def slugify(value: str) -> str:
    normalized = unicodedata.normalize(
        "NFKD",
        value,
    )

    ascii_value = normalized.encode(
        "ascii",
        "ignore",
    ).decode("ascii")

    slug = re.sub(
        r"[^a-zA-Z0-9]+",
        "-",
        ascii_value,
    ).strip("-").lower()

    if not slug:
        raise CatalogClientsConflictError(
            "Não foi possível gerar um slug válido."
        )

    return slug


def add_audit_log(
    database: Session,
    *,
    actor_user_id: UUID,
    action: str,
    entity_type: str,
    entity_id: UUID,
    details: dict | None = None,
) -> None:
    values = {
        "action": action,
        "entity_type": entity_type,
        "entity_id": str(entity_id),
    }

    if hasattr(AuditLog, "user_id"):
        values["user_id"] = actor_user_id
    elif hasattr(AuditLog, "actor_user_id"):
        values["actor_user_id"] = actor_user_id

    if hasattr(AuditLog, "details"):
        values["details"] = details

    database.add(
        AuditLog(**values)
    )


def commit_changes(
    database: Session,
    conflict_message: str,
) -> None:
    try:
        database.commit()
    except IntegrityError as exc:
        database.rollback()

        raise CatalogClientsConflictError(
            conflict_message
        ) from exc


def get_customer(
    database: Session,
    customer_id: UUID,
) -> Customer:
    customer = database.get(
        Customer,
        customer_id,
    )

    if customer is None:
        raise CatalogClientsNotFoundError(
            "Cliente não encontrado."
        )

    return customer


def get_category(
    database: Session,
    category_id: UUID,
) -> ServiceCategory:
    category = database.get(
        ServiceCategory,
        category_id,
    )

    if category is None:
        raise CatalogClientsNotFoundError(
            "Categoria não encontrada."
        )

    return category


def get_service(
    database: Session,
    service_id: UUID,
) -> Service:
    service = database.scalar(
        select(Service)
        .options(
            joinedload(Service.category)
        )
        .where(
            Service.id == service_id
        )
    )

    if service is None:
        raise CatalogClientsNotFoundError(
            "Serviço não encontrado."
        )

    return service


def ensure_customer_phone_available(
    database: Session,
    phone: str,
    customer_id: UUID | None = None,
) -> None:
    statement = select(Customer).where(
        Customer.phone == phone
    )

    if customer_id is not None:
        statement = statement.where(
            Customer.id != customer_id
        )

    if database.scalar(statement) is not None:
        raise CatalogClientsConflictError(
            "Já existe um cliente com esse telefone."
        )


def ensure_slug_available(
    database: Session,
    model,
    slug: str,
    current_id: UUID | None = None,
) -> None:
    statement = select(model).where(
        model.slug == slug
    )

    if current_id is not None:
        statement = statement.where(
            model.id != current_id
        )

    if database.scalar(statement) is not None:
        raise CatalogClientsConflictError(
            "Já existe um registro com esse slug."
        )


def customer_to_data(
    database: Session,
    customer: Customer,
) -> dict:
    appointment_count, last_appointment_at = (
        database.execute(
            select(
                func.count(Appointment.id),
                func.max(Appointment.starts_at),
            ).where(
                Appointment.customer_id
                == customer.id
            )
        ).one()
    )

    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "birth_date": customer.birth_date,
        "active": customer.active,
        "notes": customer.notes,
        "loyalty_points": customer.loyalty_points,
        "last_service_at": customer.last_service_at,
        "return_due_at": customer.return_due_at,
        "appointment_count": int(
            appointment_count or 0
        ),
        "last_appointment_at": (
            last_appointment_at
        ),
        "created_at": customer.created_at,
        "updated_at": customer.updated_at,
    }


def list_customers(
    database: Session,
    *,
    search: str | None = None,
    active: bool | None = None,
) -> list[dict]:
    statement = (
        select(
            Customer,
            func.count(Appointment.id),
            func.max(Appointment.starts_at),
        )
        .outerjoin(
            Appointment,
            Appointment.customer_id
            == Customer.id,
        )
        .group_by(Customer.id)
        .order_by(Customer.name)
    )

    if active is not None:
        statement = statement.where(
            Customer.active.is_(active)
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
                    Customer.name
                ).like(term),
                func.lower(
                    func.coalesce(
                        Customer.email,
                        "",
                    )
                ).like(term),
                Customer.phone.like(term),
            )
        )

    rows = database.execute(
        statement
    ).all()

    return [
        {
            "id": customer.id,
            "name": customer.name,
            "email": customer.email,
            "phone": customer.phone,
            "birth_date": customer.birth_date,
            "active": customer.active,
            "notes": customer.notes,
            "loyalty_points": (
                customer.loyalty_points
            ),
            "last_service_at": (
                customer.last_service_at
            ),
            "return_due_at": (
                customer.return_due_at
            ),
            "appointment_count": int(
                appointment_count or 0
            ),
            "last_appointment_at": (
                last_appointment_at
            ),
            "created_at": customer.created_at,
            "updated_at": customer.updated_at,
        }
        for (
            customer,
            appointment_count,
            last_appointment_at,
        ) in rows
    ]


def create_customer(
    database: Session,
    payload: CustomerCreate,
    actor_user_id: UUID,
) -> Customer:
    ensure_customer_phone_available(
        database,
        payload.phone,
    )

    customer = Customer(
        name=payload.name,
        email=normalize_email(
            str(payload.email)
            if payload.email
            else None
        ),
        phone=payload.phone,
        birth_date=payload.birth_date,
        active=payload.active,
        notes=payload.notes,
        loyalty_points=payload.loyalty_points,
        last_service_at=payload.last_service_at,
        return_due_at=payload.return_due_at,
    )

    database.add(customer)
    database.flush()

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="customers.customer_created",
        entity_type="customer",
        entity_id=customer.id,
        details={
            "phone": customer.phone,
        },
    )

    commit_changes(
        database,
        "Não foi possível criar o cliente.",
    )

    database.refresh(customer)
    return customer


def update_customer(
    database: Session,
    customer_id: UUID,
    payload: CustomerUpdate,
    actor_user_id: UUID,
) -> Customer:
    customer = get_customer(
        database,
        customer_id,
    )

    changed_fields: list[str] = []

    if "name" in payload.model_fields_set:
        if payload.name is None:
            raise CatalogClientsConflictError(
                "O nome do cliente não pode ser vazio."
            )

        customer.name = payload.name
        changed_fields.append("name")

    if "email" in payload.model_fields_set:
        customer.email = normalize_email(
            str(payload.email)
            if payload.email
            else None
        )
        changed_fields.append("email")

    if "phone" in payload.model_fields_set:
        if payload.phone is None:
            raise CatalogClientsConflictError(
                "O telefone não pode ser vazio."
            )

        ensure_customer_phone_available(
            database,
            payload.phone,
            customer.id,
        )

        customer.phone = payload.phone
        changed_fields.append("phone")

    for field_name in (
        "birth_date",
        "active",
        "notes",
        "loyalty_points",
        "last_service_at",
        "return_due_at",
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
                "active",
                "loyalty_points",
            }
            and value is None
        ):
            raise CatalogClientsConflictError(
                (
                    field_name
                    + " não pode ser vazio."
                )
            )

        setattr(
            customer,
            field_name,
            value,
        )

        changed_fields.append(
            field_name
        )

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="customers.customer_updated",
        entity_type="customer",
        entity_id=customer.id,
        details={
            "fields": sorted(
                changed_fields
            ),
        },
    )

    commit_changes(
        database,
        "Não foi possível atualizar o cliente.",
    )

    database.refresh(customer)
    return customer


def list_categories(
    database: Session,
    *,
    active: bool | None = None,
) -> list[ServiceCategory]:
    statement = select(
        ServiceCategory
    ).order_by(
        ServiceCategory.position,
        ServiceCategory.name,
    )

    if active is not None:
        statement = statement.where(
            ServiceCategory.active.is_(active)
        )

    return list(
        database.scalars(statement).all()
    )


def create_category(
    database: Session,
    payload: ServiceCategoryCreate,
    actor_user_id: UUID,
) -> ServiceCategory:
    category_slug = slugify(
        payload.slug or payload.name
    )

    ensure_slug_available(
        database,
        ServiceCategory,
        category_slug,
    )

    category = ServiceCategory(
        name=payload.name,
        slug=category_slug,
        description=payload.description,
        active=payload.active,
        position=payload.position,
    )

    database.add(category)
    database.flush()

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="catalog.category_created",
        entity_type="service_category",
        entity_id=category.id,
        details={
            "slug": category.slug,
        },
    )

    commit_changes(
        database,
        "Não foi possível criar a categoria.",
    )

    database.refresh(category)
    return category


def update_category(
    database: Session,
    category_id: UUID,
    payload: ServiceCategoryUpdate,
    actor_user_id: UUID,
) -> ServiceCategory:
    category = get_category(
        database,
        category_id,
    )

    changed_fields: list[str] = []

    if "name" in payload.model_fields_set:
        if payload.name is None:
            raise CatalogClientsConflictError(
                "O nome da categoria não pode ser vazio."
            )

        category.name = payload.name
        changed_fields.append("name")

    if "slug" in payload.model_fields_set:
        if payload.slug is None:
            raise CatalogClientsConflictError(
                "O slug não pode ser vazio."
            )

        category_slug = slugify(
            payload.slug
        )

        ensure_slug_available(
            database,
            ServiceCategory,
            category_slug,
            category.id,
        )

        category.slug = category_slug
        changed_fields.append("slug")

    for field_name in (
        "description",
        "active",
        "position",
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
                "active",
                "position",
            }
            and value is None
        ):
            raise CatalogClientsConflictError(
                (
                    field_name
                    + " não pode ser vazio."
                )
            )

        setattr(
            category,
            field_name,
            value,
        )

        changed_fields.append(
            field_name
        )

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="catalog.category_updated",
        entity_type="service_category",
        entity_id=category.id,
        details={
            "fields": sorted(
                changed_fields
            ),
        },
    )

    commit_changes(
        database,
        "Não foi possível atualizar a categoria.",
    )

    database.refresh(category)
    return category


def service_to_data(
    database: Session,
    service: Service,
) -> dict:
    appointment_count = database.scalar(
        select(
            func.count(Appointment.id)
        ).where(
            Appointment.service_id
            == service.id
        )
    )

    return {
        "id": service.id,
        "category_id": service.category_id,
        "category": service.category,
        "name": service.name,
        "slug": service.slug,
        "description": service.description,
        "duration_minutes": (
            service.duration_minutes
        ),
        "price_cents": service.price_cents,
        "position": service.position,
        "active": service.active,
        "appointment_count": int(
            appointment_count or 0
        ),
        "created_at": service.created_at,
        "updated_at": service.updated_at,
    }


def list_services(
    database: Session,
    *,
    search: str | None = None,
    active: bool | None = None,
    category_id: UUID | None = None,
) -> list[Service]:
    statement = (
        select(Service)
        .options(
            joinedload(Service.category)
        )
        .order_by(
            Service.position,
            Service.name,
        )
    )

    if active is not None:
        statement = statement.where(
            Service.active.is_(active)
        )

    if category_id is not None:
        statement = statement.where(
            Service.category_id
            == category_id
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
                    Service.name
                ).like(term),
                func.lower(
                    Service.slug
                ).like(term),
                func.lower(
                    func.coalesce(
                        Service.description,
                        "",
                    )
                ).like(term),
            )
        )

    return list(
        database.scalars(statement).all()
    )


def resolve_category(
    database: Session,
    category_id: UUID | None,
) -> ServiceCategory | None:
    if category_id is None:
        return None

    return get_category(
        database,
        category_id,
    )


def create_service(
    database: Session,
    payload: ServiceCreate,
    actor_user_id: UUID,
) -> Service:
    service_slug = slugify(
        payload.slug or payload.name
    )

    ensure_slug_available(
        database,
        Service,
        service_slug,
    )

    category = resolve_category(
        database,
        payload.category_id,
    )

    service = Service(
        category=category,
        name=payload.name,
        slug=service_slug,
        description=payload.description,
        duration_minutes=(
            payload.duration_minutes
        ),
        price_cents=payload.price_cents,
        position=payload.position,
        active=payload.active,
    )

    database.add(service)
    database.flush()

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="catalog.service_created",
        entity_type="service",
        entity_id=service.id,
        details={
            "slug": service.slug,
            "category_id": (
                str(service.category_id)
                if service.category_id
                else None
            ),
        },
    )

    commit_changes(
        database,
        "Não foi possível criar o serviço.",
    )

    return get_service(
        database,
        service.id,
    )


def update_service(
    database: Session,
    service_id: UUID,
    payload: ServiceUpdate,
    actor_user_id: UUID,
) -> Service:
    service = get_service(
        database,
        service_id,
    )

    changed_fields: list[str] = []

    if "category_id" in payload.model_fields_set:
        service.category = resolve_category(
            database,
            payload.category_id,
        )

        changed_fields.append(
            "category_id"
        )

    if "name" in payload.model_fields_set:
        if payload.name is None:
            raise CatalogClientsConflictError(
                "O nome do serviço não pode ser vazio."
            )

        service.name = payload.name
        changed_fields.append("name")

    if "slug" in payload.model_fields_set:
        if payload.slug is None:
            raise CatalogClientsConflictError(
                "O slug não pode ser vazio."
            )

        service_slug = slugify(
            payload.slug
        )

        ensure_slug_available(
            database,
            Service,
            service_slug,
            service.id,
        )

        service.slug = service_slug
        changed_fields.append("slug")

    for field_name in (
        "description",
        "duration_minutes",
        "price_cents",
        "position",
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
                "duration_minutes",
                "price_cents",
                "position",
                "active",
            }
            and value is None
        ):
            raise CatalogClientsConflictError(
                (
                    field_name
                    + " não pode ser vazio."
                )
            )

        setattr(
            service,
            field_name,
            value,
        )

        changed_fields.append(
            field_name
        )

    add_audit_log(
        database,
        actor_user_id=actor_user_id,
        action="catalog.service_updated",
        entity_type="service",
        entity_id=service.id,
        details={
            "fields": sorted(
                changed_fields
            ),
        },
    )

    commit_changes(
        database,
        "Não foi possível atualizar o serviço.",
    )

    return get_service(
        database,
        service.id,
    )
