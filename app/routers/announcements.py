from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.deps import current_user, require_organizer
from app.models import AnnouncementCreate, AnnouncementUpdate
from app.pagination import paginate
from app.zerodb import emit_event, insert_row, query_rows, update_row, upsert_vector

router = APIRouter(tags=["Announcements"])

TABLE = "announcements"


@router.post("/api/announcements", status_code=201)
async def create_announcement(
    body: AnnouncementCreate,
    user: dict = Depends(require_organizer),
):
    row = {
        "title": body.title,
        "body": body.body,
        "channel_slug": body.channel_slug,
        "pinned": body.pinned,
        "author_id": str(user.get("id", "")),
        "published_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await insert_row(TABLE, row)

    await emit_event(
        "community.announcement",
        {
            "title": body.title,
            "author_id": row["author_id"],
            "channel_slug": body.channel_slug,
        },
    )

    ann_id = result.get("id") or result.get("_id", "")
    if ann_id:
        try:
            await upsert_vector(
                "announcements",
                str(ann_id),
                f"{body.title}\n{body.body}",
                metadata={"channel_slug": body.channel_slug, "author_id": row["author_id"]},
            )
        except Exception:
            pass

    return result


@router.get("/api/announcements/pinned")
async def list_pinned_announcements(limit: int = 50, skip: int = 0):
    result = await query_rows(
        TABLE,
        filters={"pinned": {"$eq": True}},
        sort={"published_at": -1},
        limit=limit,
        skip=skip,
    )
    return paginate(result, limit=limit, skip=skip)


@router.get("/api/channels/{slug}/announcements")
async def list_announcements(slug: str, limit: int = 50, skip: int = 0):
    result = await query_rows(
        TABLE,
        filters={"channel_slug": {"$eq": slug}},
        sort={"published_at": -1},
        limit=limit,
        skip=skip,
    )
    return paginate(result, limit=limit, skip=skip)


@router.patch("/api/announcements/{announcement_id}")
async def update_announcement(
    announcement_id: str,
    body: AnnouncementUpdate,
    user: dict = Depends(require_organizer),
):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    return await update_row(TABLE, announcement_id, updates)
