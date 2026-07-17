import os
import sys
from pathlib import Path

sys.path.insert(
    0,
    str(Path(__file__).resolve().parents[1]),
)

from app.db import SessionLocal
from app.services.identity_service import (
    IdentityConflictError,
    create_user,
    seed_identity,
)


def required_environment(name: str) -> str:
    value = os.getenv(name, "").strip()

    if not value:
        raise RuntimeError(
            f"Variável obrigatória ausente: {name}"
        )

    return value


def main() -> None:
    name = required_environment(
        "BOOTSTRAP_ADMIN_NAME"
    )
    email = required_environment(
        "BOOTSTRAP_ADMIN_EMAIL"
    )
    password = required_environment(
        "BOOTSTRAP_ADMIN_PASSWORD"
    )

    database = SessionLocal()

    try:
        seed_identity(database)

        try:
            user = create_user(
                database,
                name=name,
                email=email,
                password=password,
                role_slugs=["administrator"],
            )
        except IdentityConflictError as exc:
            raise RuntimeError(str(exc)) from exc

        print("ADMIN_BOOTSTRAP_OK")
        print(f"USER_ID={user.id}")
        print(f"EMAIL={user.email}")
    finally:
        database.close()


if __name__ == "__main__":
    main()