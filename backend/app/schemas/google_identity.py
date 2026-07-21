
from pydantic import BaseModel, Field


class GoogleLoginRequest(BaseModel):
    credential: str = Field(
        min_length=100,
        max_length=10000,
    )
