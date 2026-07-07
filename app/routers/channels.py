import time
import uuid

import jwt
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.deps import current_user, require_organizer
from app.models import ChannelCreate, ChannelUpdate
from app.zerodb import insert_row, query_rows, update_row

router = APIRouter(prefix="/api/channels", tags=["Channels"])

TABLE = "channels"


@router.post("", status_code=201)
async def create_channel(body: ChannelCreate, user: dict = Depends(require_organizer)):
    existing = await query_rows(
        TABLE, filters={"slug": {"$eq": body.slug}}, limit=1
    )
    if existing.get("data"):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Channel '{body.slug}' already exists",
        )

    stream_id = str(uuid.uuid4())
    row = {
        "slug": body.slug,
        "name": body.name,
        "topic": body.topic,
        "stream_id": stream_id,
        "visibility": body.visibility,
        "created_by": str(user.get("id", "")),
        "is_default": False,
        "archived": False,
    }
    result = await insert_row(TABLE, row)
    return result


@router.get("")
async def list_channels(
    visibility: str | None = None,
    limit: int = 50,
    skip: int = 0,
):
    filters: dict = {"archived": {"$eq": False}}
    if visibility:
        filters["visibility"] = {"$eq": visibility}
    return await query_rows(TABLE, filters=filters, limit=limit, skip=skip)


@router.get("/{slug}")
async def get_channel(slug: str):
    result = await query_rows(TABLE, filters={"slug": {"$eq": slug}}, limit=1)
    rows = result.get("data", [])
    if not rows:
        raise HTTPException(status_code=404, detail="Channel not found")
    return rows[0]


@router.patch("/{slug}")
async def update_channel(
    slug: str,
    body: ChannelUpdate,
    user: dict = Depends(require_organizer),
):
    result = await query_rows(TABLE, filters={"slug": {"$eq": slug}}, limit=1)
    rows = result.get("data", [])
    if not rows:
        raise HTTPException(status_code=404, detail="Channel not found")

    row_id = rows[0].get("id") or rows[0].get("_id")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    return await update_row(TABLE, str(row_id), updates)


@router.post("/{slug}/ws-token")
async def mint_ws_token(slug: str, user: dict = Depends(current_user)):
    result = await query_rows(TABLE, filters={"slug": {"$eq": slug}}, limit=1)
    rows = result.get("data", [])
    if not rows:
        raise HTTPException(status_code=404, detail="Channel not found")

    channel = rows[0]
    now = int(time.time())
    payload = {
        "sub": str(user.get("id", "")),
        "channel_slug": slug,
        "stream_id": channel.get("stream_id", ""),
        "iat": now,
        "exp": now + settings.ws_token_ttl_seconds,
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm="HS256")
    return {"token": token, "expires_in": settings.ws_token_ttl_seconds}
