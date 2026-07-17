from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


class RolePublic(BaseModel):
    id: UUID
    name: str
    slug: str
    description: str | None
    active: bool
    permissions: list[str]


class UserCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=120,
    )
    email: EmailStr
    password: str = Field(
        min_length=10,
        max_length=256,
    )
    role_slugs: list[str] = Field(
        min_length=1,
    )

    @field_validator(
        "name",
        mode="after",
    )
    @classmethod
    def normalize_name(
        cls,
        value: str,
    ) -> str:
        return " ".join(value.split())

    @field_validator(
        "role_slugs",
        mode="after",
    )
    @classmethod
    def normalize_roles(
        cls,
        value: list[str],
    ) -> list[str]:
        normalized = sorted(
            {
                item.strip().lower()
                for item in value
                if item.strip()
            }
        )

        if not normalized:
            raise ValueError(
                "Informe ao menos um papel."
            )

        return normalized


class UserUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    email: EmailStr | None = None
    password: str | None = Field(
        default=None,
        min_length=10,
        max_length=256,
    )
    role_slugs: list[str] | None = Field(
        default=None,
        min_length=1,
    )
    active: bool | None = None

    @field_validator(
        "name",
        mode="after",
    )
    @classmethod
    def normalize_name(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return " ".join(value.split())

    @field_validator(
        "role_slugs",
        mode="after",
    )
    @classmethod
    def normalize_roles(
        cls,
        value: list[str] | None,
    ) -> list[str] | None:
        if value is None:
            return None

        normalized = sorted(
            {
                item.strip().lower()
                for item in value
                if item.strip()
            }
        )

        if not normalized:
            raise ValueError(
                "Informe ao menos um papel."
            )

        return normalized


class UserAdminPublic(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    active: bool
    last_login_at: datetime | None
    created_at: datetime
    updated_at: datetime
    roles: list[str]
    permissions: list[str]
    employee_id: UUID | None


class EmployeeCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=120,
    )
    email: EmailStr | None = None
    phone: str | None = Field(
        default=None,
        max_length=32,
    )
    job_title: str | None = Field(
        default=None,
        max_length=120,
    )
    user_id: UUID | None = None
    barber_id: UUID | None = None
    active: bool = True

    @field_validator(
        "name",
        mode="after",
    )
    @classmethod
    def normalize_name(
        cls,
        value: str,
    ) -> str:
        return " ".join(value.split())

    @field_validator(
        "phone",
        "job_title",
        mode="after",
    )
    @classmethod
    def normalize_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return value.strip() or None


class EmployeeUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=120,
    )
    email: EmailStr | None = None
    phone: str | None = Field(
        default=None,
        max_length=32,
    )
    job_title: str | None = Field(
        default=None,
        max_length=120,
    )
    user_id: UUID | None = None
    barber_id: UUID | None = None
    active: bool | None = None

    @field_validator(
        "name",
        mode="after",
    )
    @classmethod
    def normalize_name(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return " ".join(value.split())

    @field_validator(
        "phone",
        "job_title",
        mode="after",
    )
    @classmethod
    def normalize_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return value.strip() or None


class EmployeePublic(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    name: str
    email: EmailStr | None
    phone: str | None
    job_title: str | None
    user_id: UUID | None
    barber_id: UUID | None
    active: bool
    created_at: datetime
    updated_at: datetime