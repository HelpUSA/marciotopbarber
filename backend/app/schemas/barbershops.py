
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
)


MembershipRole = Literal[
    "barbershop-owner",
    "barbershop-administrator",
    "operator",
    "employee",
]


class BarbershopCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=160,
    )
    slug: str = Field(
        min_length=2,
        max_length=160,
    )
    owner_user_id: UUID | None = None
    document: str | None = Field(
        default=None,
        max_length=32,
    )
    email: EmailStr | None = None
    phone: str | None = Field(
        default=None,
        max_length=32,
    )
    timezone: str = Field(
        default="America/Recife",
        min_length=3,
        max_length=64,
    )

    @field_validator(
        "name",
        "slug",
        "timezone",
    )
    @classmethod
    def strip_required(
        cls,
        value: str,
    ) -> str:
        return value.strip()


class BarbershopUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=160,
    )
    document: str | None = Field(
        default=None,
        max_length=32,
    )
    email: EmailStr | None = None
    phone: str | None = Field(
        default=None,
        max_length=32,
    )
    timezone: str | None = Field(
        default=None,
        min_length=3,
        max_length=64,
    )
    active: bool | None = None


class MembershipCreate(BaseModel):
    user_id: UUID
    role: MembershipRole
    active: bool = True


class MembershipUpdate(BaseModel):
    role: MembershipRole | None = None
    active: bool | None = None


class MembershipPublic(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    user_id: UUID
    user_name: str
    user_email: EmailStr
    role: MembershipRole
    active: bool


class BarbershopPublic(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    name: str
    slug: str
    document: str | None
    email: EmailStr | None
    phone: str | None
    timezone: str
    active: bool
    current_user_role: MembershipRole | None = None


class PublicBarbershopSummary(BaseModel):
    id: UUID
    name: str
    slug: str
