from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class ChannelCreate(BaseModel):
    slug: str = Field(..., pattern=r"^[a-z0-9_-]+$", max_length=64)
    name: str = Field(..., max_length=128)
    topic: str = ""
    visibility: str = Field(default="public", pattern=r"^(public|private)$")


class ChannelUpdate(BaseModel):
    topic: str | None = None
    visibility: str | None = Field(default=None, pattern=r"^(public|private)$")
    archived: bool | None = None


class AnnouncementCreate(BaseModel):
    title: str = Field(..., max_length=256)
    body: str
    channel_slug: str | None = None
    pinned: bool = False


class AnnouncementUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    pinned: bool | None = None


class EventCreate(BaseModel):
    title: str = Field(..., max_length=256)
    description: str = ""
    location: str = ""
    starts_at: str = Field(..., description="ISO-8601")
    ends_at: str | None = None
    max_attendees: int | None = None


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    location: str | None = None
    starts_at: str | None = None
    ends_at: str | None = None


class RSVPRequest(BaseModel):
    status: str = Field(default="going", pattern=r"^(going|maybe|not_going)$")


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
