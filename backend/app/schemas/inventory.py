from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)


MovementType = Literal[
    "entry",
    "exit",
    "adjustment",
]


def normalize_required_text(
    value: str,
) -> str:
    return " ".join(value.split())


def normalize_optional_text(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    return normalized or None


def normalize_digits(
    value: str | None,
) -> str | None:
    if value is None:
        return None

    digits = "".join(
        character
        for character in value
        if character.isdigit()
    )

    return digits or None


def normalize_sku(value: str) -> str:
    normalized = reformat_code(value)

    if not normalized:
        raise ValueError(
            "SKU obrigatório."
        )

    return normalized


def reformat_code(value: str) -> str:
    return "-".join(
        value
        .strip()
        .upper()
        .replace("_", "-")
        .split()
    )


class SupplierCreate(BaseModel):
    legal_name: str = Field(
        min_length=2,
        max_length=160,
    )
    trade_name: str | None = Field(
        default=None,
        max_length=160,
    )
    document: str | None = Field(
        default=None,
        max_length=32,
    )
    contact_name: str | None = Field(
        default=None,
        max_length=120,
    )
    email: EmailStr | None = None
    phone: str | None = Field(
        default=None,
        max_length=32,
    )
    address: str | None = Field(
        default=None,
        max_length=2000,
    )
    notes: str | None = Field(
        default=None,
        max_length=2000,
    )
    active: bool = True

    @field_validator(
        "legal_name",
        mode="after",
    )
    @classmethod
    def validate_legal_name(
        cls,
        value: str,
    ) -> str:
        return normalize_required_text(value)

    @field_validator(
        "trade_name",
        "contact_name",
        "address",
        "notes",
        mode="after",
    )
    @classmethod
    def validate_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)

    @field_validator(
        "document",
        "phone",
        mode="after",
    )
    @classmethod
    def validate_digits(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_digits(value)


class SupplierUpdate(BaseModel):
    legal_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=160,
    )
    trade_name: str | None = Field(
        default=None,
        max_length=160,
    )
    document: str | None = Field(
        default=None,
        max_length=32,
    )
    contact_name: str | None = Field(
        default=None,
        max_length=120,
    )
    email: EmailStr | None = None
    phone: str | None = Field(
        default=None,
        max_length=32,
    )
    address: str | None = Field(
        default=None,
        max_length=2000,
    )
    notes: str | None = Field(
        default=None,
        max_length=2000,
    )
    active: bool | None = None

    @field_validator(
        "legal_name",
        mode="after",
    )
    @classmethod
    def validate_legal_name(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return normalize_required_text(value)

    @field_validator(
        "trade_name",
        "contact_name",
        "address",
        "notes",
        mode="after",
    )
    @classmethod
    def validate_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)

    @field_validator(
        "document",
        "phone",
        mode="after",
    )
    @classmethod
    def validate_digits(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_digits(value)


class SupplierSummary(BaseModel):
    id: UUID
    legal_name: str
    trade_name: str | None
    active: bool


class SupplierPublic(BaseModel):
    id: UUID
    legal_name: str
    trade_name: str | None
    document: str | None
    contact_name: str | None
    email: EmailStr | None
    phone: str | None
    address: str | None
    notes: str | None
    active: bool
    product_count: int
    created_at: datetime
    updated_at: datetime


class ProductCreate(BaseModel):
    supplier_id: UUID | None = None
    name: str = Field(
        min_length=2,
        max_length=160,
    )
    sku: str = Field(
        min_length=1,
        max_length=80,
    )
    barcode: str | None = Field(
        default=None,
        max_length=80,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )
    unit_label: str = Field(
        default="un",
        min_length=1,
        max_length=24,
    )
    cost_cents: int = Field(
        default=0,
        ge=0,
        le=100000000,
    )
    sale_price_cents: int = Field(
        default=0,
        ge=0,
        le=100000000,
    )
    initial_stock: int = Field(
        default=0,
        ge=0,
        le=100000000,
    )
    minimum_stock: int = Field(
        default=0,
        ge=0,
        le=100000000,
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
        return normalize_required_text(value)

    @field_validator(
        "sku",
        mode="after",
    )
    @classmethod
    def validate_sku(
        cls,
        value: str,
    ) -> str:
        return normalize_sku(value)

    @field_validator(
        "barcode",
        "description",
        mode="after",
    )
    @classmethod
    def validate_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)

    @field_validator(
        "unit_label",
        mode="after",
    )
    @classmethod
    def validate_unit_label(
        cls,
        value: str,
    ) -> str:
        return value.strip().lower()


class ProductUpdate(BaseModel):
    supplier_id: UUID | None = None
    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=160,
    )
    sku: str | None = Field(
        default=None,
        min_length=1,
        max_length=80,
    )
    barcode: str | None = Field(
        default=None,
        max_length=80,
    )
    description: str | None = Field(
        default=None,
        max_length=2000,
    )
    unit_label: str | None = Field(
        default=None,
        min_length=1,
        max_length=24,
    )
    cost_cents: int | None = Field(
        default=None,
        ge=0,
        le=100000000,
    )
    sale_price_cents: int | None = Field(
        default=None,
        ge=0,
        le=100000000,
    )
    minimum_stock: int | None = Field(
        default=None,
        ge=0,
        le=100000000,
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

        return normalize_required_text(value)

    @field_validator(
        "sku",
        mode="after",
    )
    @classmethod
    def validate_sku(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return normalize_sku(value)

    @field_validator(
        "barcode",
        "description",
        mode="after",
    )
    @classmethod
    def validate_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        return normalize_optional_text(value)

    @field_validator(
        "unit_label",
        mode="after",
    )
    @classmethod
    def validate_unit_label(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return value.strip().lower()


class ProductSummary(BaseModel):
    id: UUID
    name: str
    sku: str
    unit_label: str


class ProductPublic(BaseModel):
    id: UUID
    supplier_id: UUID | None
    supplier: SupplierSummary | None
    name: str
    sku: str
    barcode: str | None
    description: str | None
    unit_label: str
    cost_cents: int
    sale_price_cents: int
    stock_quantity: int
    minimum_stock: int
    low_stock: bool
    active: bool
    created_at: datetime
    updated_at: datetime


class StockMovementCreate(BaseModel):
    product_id: UUID
    supplier_id: UUID | None = None
    movement_type: MovementType
    quantity: int = Field(
        ge=-100000000,
        le=100000000,
    )
    unit_cost_cents: int | None = Field(
        default=None,
        ge=0,
        le=100000000,
    )
    reason: str = Field(
        min_length=2,
        max_length=255,
    )
    reference: str | None = Field(
        default=None,
        max_length=120,
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

    @model_validator(mode="after")
    def validate_quantity(self):
        if self.quantity == 0:
            raise ValueError(
                "A quantidade não pode ser zero."
            )

        if (
            self.movement_type
            in {"entry", "exit"}
            and self.quantity < 0
        ):
            raise ValueError(
                (
                    "Entradas e saídas devem usar "
                    "quantidade positiva."
                )
            )

        return self


class StockMovementPublic(BaseModel):
    id: UUID
    product_id: UUID
    product: ProductSummary
    supplier_id: UUID | None
    supplier: SupplierSummary | None
    movement_type: MovementType
    quantity_delta: int
    stock_before: int
    stock_after: int
    unit_cost_cents: int | None
    reason: str
    reference: str | None
    occurred_at: datetime
    created_at: datetime


class InventorySummary(BaseModel):
    total_products: int
    active_products: int
    low_stock_products: int
    out_of_stock_products: int
    total_units: int
    inventory_cost_cents: int
    inventory_sale_value_cents: int
