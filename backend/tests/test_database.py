from datetime import (
    UTC,
    datetime,
    time,
)

from sqlalchemy import (
    create_engine,
    select,
)
from sqlalchemy.orm import Session

from app.db import Base
from app.models import (
    Appointment,
    AuditLog,
    AuthSession,
    Barber,
    BarberBlock,
    BarberSchedule,
    Customer,
    Employee,
    Permission,
    Role,
    RolePermission,
    Service,
    User,
    UserRole,
)
from app.core.security import hash_password


def test_database_schema_and_relationships():
    test_engine = create_engine(
        "sqlite+pysqlite:///:memory:"
    )

    Base.metadata.create_all(test_engine)

    with Session(test_engine) as session:
        customer = Customer(
            name="Cliente Teste",
            email="cliente@example.com",
            phone="+5583999999999",
        )

        barber = Barber(
            name="Marcio",
            slug="marcio",
        )

        service = Service(
            name="Corte",
            slug="corte",
            duration_minutes=45,
            price_cents=5000,
        )

        barber.schedules.append(
            BarberSchedule(
                weekday=0,
                start_time=time(9, 0),
                end_time=time(18, 0),
            )
        )

        barber.blocks.append(
            BarberBlock(
                starts_at=datetime(
                    2035,
                    7,
                    16,
                    15,
                    0,
                    tzinfo=UTC,
                ),
                ends_at=datetime(
                    2035,
                    7,
                    16,
                    16,
                    0,
                    tzinfo=UTC,
                ),
                reason="Almoço",
            )
        )

        appointment = Appointment(
            customer=customer,
            barber=barber,
            service=service,
            starts_at=datetime(
                2035,
                7,
                16,
                14,
                0,
                tzinfo=UTC,
            ),
        )

        permission = Permission(
            code="admin.access",
            name="Acesso administrativo",
        )

        role = Role(
            name="Administrador",
            slug="administrator",
        )

        role.permission_links.append(
            RolePermission(
                permission=permission
            )
        )

        user = User(
            name="Administrador",
            email="admin@example.com",
            password_hash=hash_password(
                "SenhaMuitoForte123"
            ),
        )

        user.role_links.append(
            UserRole(role=role)
        )

        employee = Employee(
            user=user,
            barber=barber,
            name="Marcio",
            email="marcio@example.com",
            job_title="Barbeiro",
        )

        auth_session = AuthSession(
            user=user,
            token_hash="a" * 64,
            expires_at=datetime(
                2035,
                7,
                16,
                18,
                0,
                tzinfo=UTC,
            ),
        )

        audit = AuditLog(
            user=user,
            action="test.created",
            entity_type="test",
        )

        session.add_all(
            [
                appointment,
                employee,
                auth_session,
                audit,
            ]
        )
        session.commit()

        stored = session.scalar(
            select(User)
        )

        assert stored is not None
        assert stored.email == "admin@example.com"
        assert len(stored.role_links) == 1
        assert stored.employee is not None
        assert stored.employee.barber is not None
        assert len(stored.sessions) == 1
        assert len(stored.audit_logs) == 1

    assert set(Base.metadata.tables) == {
        "customers",
        "barbers",
        "services",
    "service_categories",
        "appointments",
        "barber_schedules",
        "barber_blocks",
        "roles",
        "permissions",
        "role_permissions",
        "users",
        "user_roles",
        "employees",
        "auth_sessions",
        "audit_logs",
    }