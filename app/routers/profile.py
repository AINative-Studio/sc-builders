"""User profiles — backed by the AINative platform profile.

The platform provides a rich, canonical, editable profile at
``/api/v1/public/profile/me`` (bio, avatar, cover photo, location, website,
social links, follower/following counts, privacy settings). We proxy it so the
SC-Builders UI reads and edits the real user profile rather than the sparse
local member_directory table.

Refs #50
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.deps import current_user, get_token
from app.proxy import forward

router = APIRouter(prefix="/api/profile", tags=["Profile"])

_UP = "/api/v1/public/profile"


class ProfileUpdate(BaseModel):
    bio: str | None = Field(None, max_length=5000)
    avatar_url: str | None = Field(None, max_length=500)
    cover_photo_url: str | None = Field(None, max_length=500)
    location: str | None = Field(None, max_length=255)
    website: str | None = Field(None, max_length=500)
    ask_me_anything: str | None = Field(None, max_length=5000)
    social_links: dict | None = None
    profile_visibility: str | None = None
    show_online_status: bool | None = None
    allow_messages_from: str | None = None
    show_read_receipts: bool | None = None


@router.get("/me")
async def get_my_profile(
    user: dict = Depends(current_user),
    token: str = Depends(get_token),
):
    return await forward("GET", f"{_UP}/me", bearer_token=token)


@router.patch("/me")
async def update_my_profile(
    body: ProfileUpdate,
    user: dict = Depends(current_user),
    token: str = Depends(get_token),
):
    return await forward(
        "PATCH", f"{_UP}/me", bearer_token=token,
        json=body.model_dump(exclude_none=True),
    )


@router.get("/{user_id}")
async def get_profile(
    user_id: str,
    token: str = Depends(get_token),
):
    return await forward("GET", f"{_UP}/{user_id}", bearer_token=token)
