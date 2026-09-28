from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    display_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    # Which language the reader has the site in. Optional so an older client,
    # or a direct API call, still registers successfully.
    locale: str = Field(default="en", max_length=5)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or value.startswith("@"):
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("locale")
    @classmethod
    def validate_locale(cls, value: str) -> str:
        # Anything unrecognised falls back rather than failing the signup —
        # the language of an email is not worth rejecting an account over.
        return value if value in ("en", "si") else "en"


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    display_name: str
    role: str
    created_at: datetime


class AuthResponse(BaseModel):
    user: UserResponse
