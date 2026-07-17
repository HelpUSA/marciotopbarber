from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import (
    AuditLog,
    Barber,
    Employee,
    Permission,
    Role,
    RolePermission,
    User,
    UserRole,
)
from app.schemas.identity_management import (
    EmployeeCreate,
    EmployeeUpdate,
    UserCreate,
    UserUpdate,
)
from app.services.identity_service import (
    IdentityConflictError,
    create_user,
    normalize_email,
    user_permission_codes,
    user_role_slugs,
)


class IdentityManagementNotFoundError(RuntimeError):
    pass


class IdentityManagementConflictError(RuntimeError):
    pass


def audit(
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


def get_user(
    database: Session,
    user_id: UUID,
) -> User:
    user = database.get(User, user_id)

    if user is None:
        raise IdentityManagementNotFoundError(
            "Usuário não encontrado."
        )

    return user


def get_employee(
    database: Session,
    employee_id: UUID,
) -> Employee:
    employee = database.get(
        Employee,
        employee_id,
    )

    if employee is None:
        raise IdentityManagementNotFoundError(
            "Funcionário não encontrado."
        )

    return employee


def role_permission_codes(
    database: Session,
    role_id: UUID,
) -> list[str]:
    return sorted(
        database.scalars(
            select(Permission.code)
            .join(
                RolePermission,
                RolePermission.permission_id
                == Permission.id,
            )
            .where(
                RolePermission.role_id == role_id,
                Permission.active.is_(True),
            )
        ).all()
    )


def list_roles(
    database: Session,
) -> list[dict]:
    roles = list(
        database.scalars(
            select(Role).order_by(Role.name)
        ).all()
    )

    return [
        {
            "id": role.id,
            "name": role.name,
            "slug": role.slug,
            "description": role.description,
            "active": role.active,
            "permissions": role_permission_codes(
                database,
                role.id,
            ),
        }
        for role in roles
    ]


def user_to_data(
    database: Session,
    user: User,
) -> dict:
    employee_id = database.scalar(
        select(Employee.id).where(
            Employee.user_id == user.id
        )
    )

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "active": user.active,
        "last_login_at": user.last_login_at,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "roles": user_role_slugs(
            database,
            user.id,
        ),
        "permissions": user_permission_codes(
            database,
            user.id,
        ),
        "employee_id": employee_id,
    }


def list_users(
    database: Session,
) -> list[dict]:
    users = list(
        database.scalars(
            select(User).order_by(User.name)
        ).all()
    )

    return [
        user_to_data(database, user)
        for user in users
    ]


def resolve_roles(
    database: Session,
    role_slugs: list[str],
) -> list[Role]:
    roles = list(
        database.scalars(
            select(Role).where(
                Role.slug.in_(role_slugs),
                Role.active.is_(True),
            )
        ).all()
    )

    found = {role.slug for role in roles}
    missing = set(role_slugs) - found

    if missing:
        raise IdentityManagementConflictError(
            "Papéis não encontrados: "
            + ", ".join(sorted(missing))
        )

    return roles


def create_managed_user(
    database: Session,
    payload: UserCreate,
    actor_user_id: UUID,
) -> User:
    try:
        user = create_user(
            database,
            name=payload.name,
            email=str(payload.email),
            password=payload.password,
            role_slugs=payload.role_slugs,
        )
    except IdentityConflictError as exc:
        raise IdentityManagementConflictError(
            str(exc)
        ) from exc

    audit(
        database,
        actor_user_id=actor_user_id,
        action="identity.user_created_by_admin",
        entity_type="user",
        entity_id=user.id,
        details={
            "roles": payload.role_slugs,
        },
    )

    database.commit()
    database.refresh(user)

    return user


def update_managed_user(
    database: Session,
    user_id: UUID,
    payload: UserUpdate,
    actor_user_id: UUID,
) -> User:
    user = get_user(database, user_id)
    changed_fields: list[str] = []

    if "name" in payload.model_fields_set:
        user.name = payload.name
        changed_fields.append("name")

    if "email" in payload.model_fields_set:
        normalized_email = normalize_email(
            str(payload.email)
        )

        existing = database.scalar(
            select(User).where(
                User.email == normalized_email,
                User.id != user.id,
            )
        )

        if existing is not None:
            raise IdentityManagementConflictError(
                "Já existe um usuário com esse e-mail."
            )

        user.email = normalized_email
        changed_fields.append("email")

    if "password" in payload.model_fields_set:
        user.password_hash = hash_password(
            payload.password
        )
        changed_fields.append("password")

    if "active" in payload.model_fields_set:
        user.active = payload.active
        changed_fields.append("active")

    if "role_slugs" in payload.model_fields_set:
        roles = resolve_roles(
            database,
            payload.role_slugs,
        )

        database.execute(
            delete(UserRole).where(
                UserRole.user_id == user.id
            )
        )

        for role in roles:
            database.add(
                UserRole(
                    user_id=user.id,
                    role_id=role.id,
                )
            )

        changed_fields.append("roles")

    audit(
        database,
        actor_user_id=actor_user_id,
        action="identity.user_updated",
        entity_type="user",
        entity_id=user.id,
        details={
            "fields": sorted(changed_fields),
        },
    )

    database.commit()
    database.refresh(user)

    return user


def list_employees(
    database: Session,
) -> list[Employee]:
    return list(
        database.scalars(
            select(Employee).order_by(
                Employee.name
            )
        ).all()
    )


def validate_employee_links(
    database: Session,
    *,
    user_id: UUID | None,
    barber_id: UUID | None,
    employee_id: UUID | None = None,
) -> None:
    if user_id is not None:
        if database.get(User, user_id) is None:
            raise IdentityManagementNotFoundError(
                "Usuário vinculado não encontrado."
            )

        statement = select(Employee).where(
            Employee.user_id == user_id
        )

        if employee_id is not None:
            statement = statement.where(
                Employee.id != employee_id
            )

        if database.scalar(statement) is not None:
            raise IdentityManagementConflictError(
                "O usuário já está vinculado a outro funcionário."
            )

    if barber_id is not None:
        if database.get(Barber, barber_id) is None:
            raise IdentityManagementNotFoundError(
                "Barbeiro vinculado não encontrado."
            )

        statement = select(Employee).where(
            Employee.barber_id == barber_id
        )

        if employee_id is not None:
            statement = statement.where(
                Employee.id != employee_id
            )

        if database.scalar(statement) is not None:
            raise IdentityManagementConflictError(
                "O barbeiro já está vinculado a outro funcionário."
            )


def create_employee(
    database: Session,
    payload: EmployeeCreate,
    actor_user_id: UUID,
) -> Employee:
    validate_employee_links(
        database,
        user_id=payload.user_id,
        barber_id=payload.barber_id,
    )

    employee = Employee(
        name=payload.name,
        email=(
            normalize_email(str(payload.email))
            if payload.email is not None
            else None
        ),
        phone=payload.phone,
        job_title=payload.job_title,
        user_id=payload.user_id,
        barber_id=payload.barber_id,
        active=payload.active,
    )

    database.add(employee)
    database.flush()

    audit(
        database,
        actor_user_id=actor_user_id,
        action="identity.employee_created",
        entity_type="employee",
        entity_id=employee.id,
        details={
            "user_id": (
                str(employee.user_id)
                if employee.user_id
                else None
            ),
            "barber_id": (
                str(employee.barber_id)
                if employee.barber_id
                else None
            ),
        },
    )

    database.commit()
    database.refresh(employee)

    return employee


def update_employee(
    database: Session,
    employee_id: UUID,
    payload: EmployeeUpdate,
    actor_user_id: UUID,
) -> Employee:
    employee = get_employee(
        database,
        employee_id,
    )

    next_user_id = (
        payload.user_id
        if "user_id" in payload.model_fields_set
        else employee.user_id
    )

    next_barber_id = (
        payload.barber_id
        if "barber_id" in payload.model_fields_set
        else employee.barber_id
    )

    validate_employee_links(
        database,
        user_id=next_user_id,
        barber_id=next_barber_id,
        employee_id=employee.id,
    )

    changed_fields: list[str] = []

    for field_name in (
        "name",
        "phone",
        "job_title",
        "user_id",
        "barber_id",
        "active",
    ):
        if field_name in payload.model_fields_set:
            setattr(
                employee,
                field_name,
                getattr(payload, field_name),
            )
            changed_fields.append(field_name)

    if "email" in payload.model_fields_set:
        employee.email = (
            normalize_email(str(payload.email))
            if payload.email is not None
            else None
        )
        changed_fields.append("email")

    audit(
        database,
        actor_user_id=actor_user_id,
        action="identity.employee_updated",
        entity_type="employee",
        entity_id=employee.id,
        details={
            "fields": sorted(changed_fields),
        },
    )

    database.commit()
    database.refresh(employee)

    return employee