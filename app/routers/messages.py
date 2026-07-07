from fastapi import APIRouter, Depends, HTTPException

from app.deps import current_user, get_token, require_organizer
from app.proxy import forward
from app.zerodb import query_rows

router = APIRouter(prefix="/api/channels/{slug}/messages", tags=["Messages"])

CHANNELS_TABLE = "channels"


async def _get_stream_id(slug: str) -> str:
    result = await query_rows(CHANNELS_TABLE, filters={"slug": {"$eq": slug}}, limit=1)
    rows = result.get("data", [])
    if not rows:
        raise HTTPException(status_code=404, detail="Channel not found")
    return rows[0].get("stream_id", "")


@router.get("")
async def get_history(
    slug: str,
    before: str | None = None,
    limit: int = 50,
    token: str = Depends(get_token),
):
    stream_id = await _get_stream_id(slug)
    params: dict = {"limit": limit}
    if before:
        params["before"] = before
    return await forward(
        "GET",
        f"/api/v1/streams/{stream_id}/chat/history",
        bearer_token=token,
        params=params,
    )


@router.post("/moderators")
async def add_moderator(
    slug: str,
    body: dict,
    user: dict = Depends(require_organizer),
    token: str = Depends(get_token),
):
    stream_id = await _get_stream_id(slug)
    return await forward(
        "POST",
        f"/api/v1/streams/{stream_id}/moderators",
        bearer_token=token,
        json=body,
    )


@router.delete("/moderators/{uid}")
async def remove_moderator(
    slug: str,
    uid: str,
    user: dict = Depends(require_organizer),
    token: str = Depends(get_token),
):
    stream_id = await _get_stream_id(slug)
    return await forward(
        "DELETE",
        f"/api/v1/streams/{stream_id}/moderators/{uid}",
        bearer_token=token,
    )
