import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models
from app.core.config import Settings, get_settings
from app.db import Base, get_db
from app.main import create_app


@pytest.fixture
def application():
    get_settings.cache_clear()

    application = create_app()

    test_engine = create_engine(
        "sqlite+pysqlite:///:memory:",
        connect_args={
            "check_same_thread": False
        },
        poolclass=StaticPool,
    )

    Base.metadata.create_all(test_engine)

    test_session_factory = sessionmaker(
        bind=test_engine,
        autoflush=False,
        expire_on_commit=False,
    )

    test_settings = Settings(
        _env_file=None,
        app_env="test",
        email_host=None,
        email_username=None,
        email_password=None,
        email_from=None,
        email_receiver=None,
    )

    def override_database():
        database = test_session_factory()

        try:
            yield database
        finally:
            database.close()

    application.dependency_overrides[
        get_settings
    ] = lambda: test_settings

    application.dependency_overrides[
        get_db
    ] = override_database

    application.state.test_session_factory = (
        test_session_factory
    )

    yield application

    application.dependency_overrides.clear()
    Base.metadata.drop_all(test_engine)
    test_engine.dispose()
    get_settings.cache_clear()


@pytest.fixture
def client(application):
    with TestClient(application) as test_client:
        yield test_client


@pytest.fixture
def db_session(application):
    factory = (
        application.state.test_session_factory
    )

    with factory() as database:
        yield database
