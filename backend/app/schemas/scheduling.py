from datetime import UTC, datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
)


class BarberPublic(BaseModel):
    id: UUID
    name: str
    slug: str


class ServicePublic(BaseModel):
    id: UUID
    name: str
    slug: str
    duration_minutes: int
    price_cents: int


class AppointmentCreate(BaseModel):
    customer_name: str = Field(
        min_length=2,
        max_length=120,
    )
    customer_email: EmailStr | None = None
    customer_phone: str = Field(
        min_length=8,
        max_length=32,
    )
    barber_id: UUID
    service_id: UUID
    starts_at: datetime
    notes: str | None = Field(
        default=None,
        max_length=2000,
    )

    @field_validator(
        "customer_name",
        mode="after",
    )
    @classmethod
    def normalize_name(
        cls,
        value: str,
    ) -> str:
        return " ".join(value.split())

    @field_validator(
        "customer_phone",
        mode="after",
    )
    @classmethod
    def normalize_phone(
        cls,
        value: str,
    ) -> str:
        digits = "".join(
            character
            for character in value
            if character.isdigit()
        )

        if not 8 <= len(digits) <= 15:
            raise ValueError(
                "Telefone deve conter entre "
                "8 e 15 dígitos."
            )

        return digits

    @field_validator(
        "starts_at",
        mode="after",
    )
    @classmethod
    def require_timezone(
        cls,
        value: datetime,
    ) -> datetime:
        if (
            value.tzinfo is None
            or value.utcoffset() is None
        ):
            raise ValueError(
                "O horário deve incluir fuso horário."
            )

        return value.astimezone(UTC)

    @field_validator(
        "notes",
        mode="after",
    )
    @classmethod
    def normalize_notes(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        normalized = value.strip()
        return normalized or None


class AppointmentCreated(BaseModel):
    id: UUID
    status: str
    starts_at: datetime
    customer_name: str
    customer_email: EmailStr | None
    customer_phone: str
    barber: BarberPublic
    service: ServicePublic
    notes: str | None
