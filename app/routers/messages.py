from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.deps import current_user, get_token
from app.pagination import paginate
from app.zerodb import delete_row, emit_event, insert_row, query_rows

router = APIRouter(prefix="/api/channels/{slug}/messages", tags=["Messages"])

TABLE = "messages"


class MessageCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=4000)


@router.get("")
async def get_history(
    slug: str,
    limit: int = 50,
    skip: int = 0,
):
    result = await query_rows(
        TABLE,
        filters={"channel_slug": {"$eq": slug}},
        sort={"sent_at": -1},
        limit=limit,
        skip=skip,
    )
    return paginate(result, limit=limit, skip=skip)


@router.post("", status_code=201)
async def send_message(
    slug: str,
    body: MessageCreate,
    user: dict = Depends(current_user),
):
    user_id = str(user.get("id", ""))
    row = {
        "channel_slug": slug,
        "sender_id": user_id,
        "sender_name": user.get("full_name") or user.get("name") or user.get("email", ""),
        "content": body.content,
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await insert_row(TABLE, row)

    await emit_event(
        "community.message.sent",
        {"channel_slug": slug, "sender_id": user_id, "preview": body.content[:100]},
    )
    return result


@router.delete("/{message_id}")
async def delete_message(
    slug: str,
    message_id: str,
    user: dict = Depends(current_user),
):
    existing = await query_rows(TABLE, filters={"id": {"$eq": message_id}}, limit=1)
    rows = existing.get("data", [])
    if not rows:
        raise HTTPException(status_code=404, detail="Message not found")

    msg = rows[0].get("row_data", rows[0])
    if msg.get("sender_id") != str(user.get("id", "")):
        role = user.get("role", "").lower()
        if role not in ("admin", "organizer", "superadmin"):
            raise HTTPException(status_code=403, detail="Cannot delete another user's message")

    return await delete_row(TABLE, message_id)
