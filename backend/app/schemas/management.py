from datetime import UTC, datetime, time
from typing import Literal
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

from app.schemas.scheduling import (
    BarberPublic,
    ServicePublic,
)


AppointmentStatus = Literal[
    "scheduled",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
]


class ScheduleCreate(BaseModel):
    weekday: int = Field(ge=0, le=6)
    start_time: time
    end_time: time
    active: bool = True

    @model_validator(mode="after")
    def validate_time_order(self):
        if self.end_time <= self.start_time:
            raise ValueError(
                "O horário final deve ser posterior "
                "ao horário inicial."
            )

        return self


class SchedulePublic(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    barber_id: UUID
    weekday: int
    start_time: time
    end_time: time
    active: bool


class BlockCreate(BaseModel):
    starts_at: datetime
    ends_at: datetime
    reason: str | None = Field(
        default=None,
        max_length=255,
    )

    @field_validator(
        "starts_at",
        "ends_at",
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
                "A data deve incluir fuso horário."
            )

        return value.astimezone(UTC)

    @model_validator(mode="after")
    def validate_time_order(self):
        if self.ends_at <= self.starts_at:
            raise ValueError(
                "O término deve ser posterior ao início."
            )

        if self.reason is not None:
            self.reason = self.reason.strip() or None

        return self


class BlockPublic(BaseModel):
    model_config = ConfigDict(
        from_attributes=True
    )

    id: UUID
    barber_id: UUID
    starts_at: datetime
    ends_at: datetime
    reason: str | None


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentAdminPublic(BaseModel):
    id: UUID
    status: str
    starts_at: datetime
    customer_name: str
    customer_email: str | None
    customer_phone: str
    barber: BarberPublic
    service: ServicePublic
    notes: str | None
