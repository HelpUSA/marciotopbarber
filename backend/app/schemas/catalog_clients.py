from datetime import date, datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


def normalize_name(value: str) -> str:
    return " ".join(value.split())


def normalize_optional_text(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    return normalized or None


def normalize_phone(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    digits = "".join(
        character
        for character in value
        if character.isdigit()
    )

    if not 8 <= len(digits) <= 15:
        raise ValueError(
            "Telefone deve conter entre 8 e 15 dígitos."
        )

    return digits


class CustomerCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=120,
    )
    email: EmailStr | None = None
    phone: str = Field(
        min_length=8,
        max_length=32,
    )
    birth_date: date | None = None
    active: bool = True
    notes: str | None = Field(
        default=None,
        max_length=2000,
    )
    loyalty_points: int = Field(
        default=0,
        ge=0,
    )
    last_service_at: datetime | None = None
    return_due_at: datetime | None = None

    @field_validator(
        "name",
        mode="after",
    )
    @classmethod
    def validate_name(
        cls,
        value: str,
    ) -> str:
        return normalize_name(value)

    @field_validator(
        "phone",
        mode="after",
    )
    @classmethod
    def validate_phone(
        cls,
        value: str,
    ) -> str:
        normalized = normalize_phone(value)

        if normalized is None:
            raise ValueError(
                "Telefone obrigatório."
            )

        return normalized

    @field_validator(
        "notes",
        mode="after",
    )
    @classmethod
    def validate_notes(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)


class CustomerUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    email: EmailStr | None = None
    phone: str | None = Field(
        default=None,
        min_length=8,
        max_length=32,
    )
    birth_date: date | None = None
    active: bool | None = None
    notes: str | None = Field(
        default=None,
        max_length=2000,
    )
    loyalty_points: int | None = Field(
        default=None,
        ge=0,
    )
    last_service_at: datetime | None = None
    return_due_at: datetime | None = None

    @field_validator(
        "name",
        mode="after",
    )
    @classmethod
    def validate_name(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return normalize_name(value)

    @field_validator(
        "phone",
        mode="after",
    )
    @classmethod
    def validate_phone(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_phone(value)

    @field_validator(
        "notes",
        mode="after",
    )
    @classmethod
    def validate_notes(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)


class CustomerPublic(BaseModel):
    id: UUID
    name: str
    email: EmailStr | None
    phone: str
    birth_date: date | None
    active: bool
    notes: str | None
    loyalty_points: int
    last_service_at: datetime | None
    return_due_at: datetime | None
    appointment_count: int
    last_appointment_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ServiceCategoryCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=120,
    )
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )
    active: bool = True
    position: int = Field(
        default=0,
        ge=0,
    )

    @field_validator(
        "name",
        mode="after",
    )
    @classmethod
    def validate_name(
        cls,
        value: str,
    ) -> str:
        return normalize_name(value)

    @field_validator(
        "slug",
        "description",
        mode="after",
    )
    @classmethod
    def validate_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)


class ServiceCategoryUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )
    active: bool | None = None
    position: int | None = Field(
        default=None,
        ge=0,
    )

    @field_validator(
        "name",
        mode="after",
    )
    @classmethod
    def validate_name(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return normalize_name(value)

    @field_validator(
        "slug",
        "description",
        mode="after",
    )
    @classmethod
    def validate_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)


class ServiceCategoryPublic(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    name: str
    slug: str
    description: str | None
    active: bool
    position: int
    created_at: datetime
    updated_at: datetime


class ServiceCreate(BaseModel):
    category_id: UUID | None = None
    name: str = Field(
        min_length=2,
        max_length=120,
    )
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )
    duration_minutes: int = Field(
        ge=5,
        le=480,
    )
    price_cents: int = Field(
        ge=0,
        le=100000000,
    )
    position: int = Field(
        default=0,
        ge=0,
    )
    active: bool = True

    @field_validator(
        "name",
        mode="after",
    )
    @classmethod
    def validate_name(
        cls,
        value: str,
    ) -> str:
        return normalize_name(value)

    @field_validator(
        "slug",
        "description",
        mode="after",
    )
    @classmethod
    def validate_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)


class ServiceUpdate(BaseModel):
    category_id: UUID | None = None
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    slug: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )
    duration_minutes: int | None = Field(
        default=None,
        ge=5,
        le=480,
    )
    price_cents: int | None = Field(
        default=None,
        ge=0,
        le=100000000,
    )
    position: int | None = Field(
        default=None,
        ge=0,
    )
    active: bool | None = None

    @field_validator(
        "name",
        mode="after",
    )
    @classmethod
    def validate_name(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return normalize_name(value)

    @field_validator(
        "slug",
        "description",
        mode="after",
    )
    @classmethod
    def validate_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)


class ServiceAdminPublic(BaseModel):
    id: UUID
    category_id: UUID | None
    category: ServiceCategoryPublic | None
    name: str
    slug: str
    description: str | None
    duration_minutes: int
    price_cents: int
    position: int
    active: bool
    appointment_count: int
    created_at: datetime
    updated_at: datetime
