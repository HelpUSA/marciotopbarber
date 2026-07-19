from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    Field,
    field_validator,
)


OrderStatus = Literal[
    "open",
    "closed",
    "cancelled",
]

ItemType = Literal[
    "service",
    "product",
]

PaymentMethod = Literal[
    "cash",
    "pix",
    "credit_card",
    "debit_card",
    "other",
]


def normalize_optional_text(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    return normalized or None


def normalize_required_text(
    value: str,
) -> str:
    return " ".join(value.split())


class ServiceOrderCreate(BaseModel):
    customer_id: UUID | None = None
    appointment_id: UUID | None = None

    notes: str | None = Field(
        default=None,
        max_length=2000,
    )

    discount_cents: int = Field(
        default=0,
        ge=0,
        le=100000000,
    )

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


class ServiceOrderUpdate(BaseModel):
    customer_id: UUID | None = None
    appointment_id: UUID | None = None

    notes: str | None = Field(
        default=None,
        max_length=2000,
    )

    discount_cents: int | None = Field(
        default=None,
        ge=0,
        le=100000000,
    )

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


class ServiceOrderServiceItemCreate(
    BaseModel
):
    service_id: UUID
    barber_id: UUID | None = None

    quantity: int = Field(
        default=1,
        ge=1,
        le=1000,
    )

    unit_price_cents: int | None = Field(
        default=None,
        ge=0,
        le=100000000,
    )


class ServiceOrderProductItemCreate(
    BaseModel
):
    product_id: UUID

    quantity: int = Field(
        default=1,
        ge=1,
        le=1000000,
    )

    unit_price_cents: int | None = Field(
        default=None,
        ge=0,
        le=100000000,
    )


class ServiceOrderPaymentCreate(
    BaseModel
):
    payment_method: PaymentMethod

    amount_cents: int = Field(
        gt=0,
        le=100000000,
    )

    reference: str | None = Field(
        default=None,
        max_length=120,
    )

    @field_validator(
        "reference",
        mode="after",
    )
    @classmethod
    def validate_reference(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)


class ServiceOrderClose(BaseModel):
    payments: list[
        ServiceOrderPaymentCreate
    ] = Field(
        min_length=1,
        max_length=10,
    )


class ServiceOrderCancel(BaseModel):
    reason: str = Field(
        min_length=2,
        max_length=255,
    )

    @field_validator(
        "reason",
        mode="after",
    )
    @classmethod
    def validate_reason(
        cls,
        value: str,
    ) -> str:
        return normalize_required_text(value)


class CustomerOrderSummary(BaseModel):
    id: UUID
    name: str
    email: str | None
    phone: str


class AppointmentOrderSummary(BaseModel):
    id: UUID
    status: str
    starts_at: datetime


class BarberOrderSummary(BaseModel):
    id: UUID
    name: str


class ServiceOrderItemPublic(BaseModel):
    id: UUID
    item_type: ItemType
    service_id: UUID | None
    product_id: UUID | None
    barber_id: UUID | None
    stock_movement_id: UUID | None
    barber: BarberOrderSummary | None
    name: str
    quantity: int
    unit_price_cents: int
    total_cents: int
    created_at: datetime


class ServiceOrderPaymentPublic(
    BaseModel
):
    id: UUID
    payment_method: PaymentMethod
    amount_cents: int
    reference: str | None
    paid_at: datetime
    created_at: datetime


class ServiceOrderPublic(BaseModel):
    id: UUID
    number: int
    customer_id: UUID | None
    appointment_id: UUID | None
    customer: CustomerOrderSummary | None
    appointment: AppointmentOrderSummary | None
    status: OrderStatus
    notes: str | None
    cancellation_reason: str | None
    subtotal_cents: int
    discount_cents: int
    total_cents: int
    paid_cents: int
    item_count: int
    payment_count: int
    items: list[ServiceOrderItemPublic]
    payments: list[
        ServiceOrderPaymentPublic
    ]
    opened_at: datetime
    closed_at: datetime | None
    cancelled_at: datetime | None
    created_at: datetime
    updated_at: datetime


class ServiceOrdersSummary(BaseModel):
    open_orders: int
    closed_orders: int
    cancelled_orders: int
    gross_revenue_cents: int
    average_ticket_cents: int
