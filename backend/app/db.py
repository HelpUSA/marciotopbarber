from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import get_settings


class Base(DeclarativeBase):
    pass


settings = get_settings()
database_url = settings.sqlalchemy_database_url

engine_options: dict[str, object] = {
    "echo": settings.sql_echo,
    "pool_pre_ping": True,
}

if database_url.startswith("sqlite"):
    engine_options["connect_args"] = {
        "check_same_thread": False
    }

engine = create_engine(
    database_url,
    **engine_options,
)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    expire_on_commit=False,
)


def get_db() -> Generator[Session, None, None]:
    database = SessionLocal()

    try:
        yield database
    finally:
        database.close()
