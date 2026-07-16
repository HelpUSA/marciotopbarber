import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings, get_settings
from app.main import create_app


@pytest.fixture
def client():
    get_settings.cache_clear()

    application = create_app()

    test_settings = Settings(
        _env_file=None,
        app_env="test",
        email_host=None,
        email_username=None,
        email_password=None,
        email_from=None,
        email_receiver=None,
    )

    application.dependency_overrides[
        get_settings
    ] = lambda: test_settings

    with TestClient(application) as test_client:
        yield test_client

    application.dependency_overrides.clear()
    get_settings.cache_clear()
