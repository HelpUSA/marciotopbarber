from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Marcio TopBarber API"
    app_version: str = "1.1.0"
    app_env: str = "development"

    allowed_origins: str = (
        "http://localhost:5173,"
        "http://127.0.0.1:5173"
    )

    database_url: str = "sqlite:///./marciotopbarber.db"
    sql_echo: bool = False
    business_timezone: str = "America/Fortaleza"
    slot_interval_minutes: int = 15
    auth_session_duration_hours: int = 12
    google_client_id: str | None = None
    platform_superadmin_email: str = "helpus.ecommerce@gmail.com"
    google_auto_provision_customers: bool = True


    email_host: str | None = None
    email_port: int = 587
    email_username: str | None = None
    email_password: str | None = None
    email_from: str | None = None
    email_receiver: str | None = None
    email_use_tls: bool = False
    email_start_tls: bool = True

    @property
    def cors_origins(self) -> list[str]:
        return [
            value.strip()
            for value in self.allowed_origins.split(",")
            if value.strip()
        ]

    @property
    def sqlalchemy_database_url(self) -> str:
        value = self.database_url.strip()

        if value.startswith("postgres://"):
            value = (
                "postgresql://"
                + value.removeprefix("postgres://")
            )

        if value.startswith("postgresql://"):
            value = (
                "postgresql+psycopg://"
                + value.removeprefix("postgresql://")
            )

        return value

    @property
    def email_from_address(self) -> str | None:
        return self.email_from or self.email_username

    def missing_email_settings(self) -> list[str]:
        values = {
            "EMAIL_HOST": self.email_host,
            "EMAIL_USERNAME": self.email_username,
            "EMAIL_PASSWORD": self.email_password,
            "EMAIL_FROM": self.email_from_address,
            "EMAIL_RECEIVER": self.email_receiver,
        }

        return [
            name
            for name, value in values.items()
            if not value
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
