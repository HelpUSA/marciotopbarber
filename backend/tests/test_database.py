from datetime import UTC, datetime, time

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.db import Base
from app.models import (
    Appointment,
    Barber,
    BarberBlock,
    BarberSchedule,
    Customer,
    Service,
)


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

        session.add(appointment)
        session.commit()

        stored = session.scalar(
            select(Appointment)
        )

        assert stored is not None
        assert stored.status == "scheduled"
        assert stored.customer.name == "Cliente Teste"
        assert stored.barber.slug == "marcio"
        assert stored.service.price_cents == 5000
        assert len(stored.barber.schedules) == 1
        assert len(stored.barber.blocks) == 1

    assert set(Base.metadata.tables) == {
        "customers",
        "barbers",
        "services",
        "appointments",
        "barber_schedules",
        "barber_blocks",
    }
