from pathlib import Path
import os
import subprocess
import sys

from sqlalchemy import create_engine, inspect, text


BACKEND_DIR = Path(__file__).resolve().parents[1]


def run_alembic(
    *arguments: str,
    environment: dict[str, str],
) -> None:
    subprocess.run(
        [
            sys.executable,
            "-m",
            "alembic",
            "-c",
            "alembic.ini",
            *arguments,
        ],
        cwd=BACKEND_DIR,
        env=environment,
        check=True,
        capture_output=True,
        text=True,
        timeout=60,
    )


def test_initial_migration_round_trip(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "migration.db"

    database_url = (
        "sqlite:///"
        + database_path.as_posix()
    )

    environment = os.environ.copy()
    environment["DATABASE_URL"] = database_url

    run_alembic(
        "upgrade",
        "head",
        environment=environment,
    )

    engine = create_engine(database_url)

    tables = set(
        inspect(engine).get_table_names()
    )

    expected_tables = {
        "alembic_version",
        "appointments",
        "barbers",
        "customers",
        "services",
    "barber_schedules",
    "barber_blocks",
    }

    assert tables == expected_tables

    with engine.connect() as connection:
        revision = connection.scalar(
            text(
                "select version_num "
                "from alembic_version"
            )
        )

    assert revision == "20260716_02"

    run_alembic(
        "check",
        environment=environment,
    )

    run_alembic(
        "downgrade",
        "base",
        environment=environment,
    )

    remaining_tables = set(
        inspect(engine).get_table_names()
    )

    application_tables = {
        "appointments",
        "barbers",
        "customers",
        "services",
    "barber_schedules",
    "barber_blocks",
    }

    assert not remaining_tables.intersection(
        application_tables
    )
