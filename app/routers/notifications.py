from fastapi import APIRouter, Depends

from app.deps import current_user
from app.models import NotificationMarkRead
from app.zerodb import insert_row, list_events, query_rows, update_row

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

READS_TABLE = "notification_reads"


@router.get("")
async def get_notifications(
    event_type: str | None = None,
    limit: int = 50,
    user: dict = Depends(current_user),
):
    events = await list_events(event_type=event_type, limit=limit)

    user_id = str(user.get("id", ""))
    reads = await query_rows(
        READS_TABLE,
        filters={"user_id": {"$eq": user_id}},
        limit=1000,
    )
    read_ids = {r.get("event_id") for r in reads.get("data", [])}

    items = events.get("events", events.get("data", []))
    unread_count = 0
    for item in items:
        eid = item.get("id") or item.get("_id", "")
        item["is_read"] = str(eid) in read_ids
        if not item["is_read"]:
            unread_count += 1

    return {"items": items, "unread_count": unread_count}


@router.post("/read")
async def mark_read(
    body: NotificationMarkRead,
    user: dict = Depends(current_user),
):
    user_id = str(user.get("id", ""))
    marked = 0
    for event_id in body.event_ids:
        existing = await query_rows(
            READS_TABLE,
            filters={"user_id": {"$eq": user_id}, "event_id": {"$eq": event_id}},
            limit=1,
        )
        if not existing.get("data"):
            await insert_row(READS_TABLE, {"user_id": user_id, "event_id": event_id})
            marked += 1
    return {"marked": marked}


@router.post("/read-all")
async def mark_all_read(user: dict = Depends(current_user)):
    user_id = str(user.get("id", ""))
    events = await list_events(limit=200)
    items = events.get("events", events.get("data", []))

    reads = await query_rows(
        READS_TABLE,
        filters={"user_id": {"$eq": user_id}},
        limit=1000,
    )
    read_ids = {r.get("event_id") for r in reads.get("data", [])}

    marked = 0
    for item in items:
        eid = str(item.get("id") or item.get("_id", ""))
        if eid and eid not in read_ids:
            await insert_row(READS_TABLE, {"user_id": user_id, "event_id": eid})
            marked += 1
    return {"marked": marked}
