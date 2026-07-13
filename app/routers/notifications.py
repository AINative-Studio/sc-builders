import asyncio

from fastapi import APIRouter, Depends

from app.deps import current_user
from app.models import NotificationMarkRead
from app.pagination import _flatten_row
from app.zerodb import insert_row, query_rows, update_row

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

READS_TABLE = "notification_reads"

NOTIFICATION_SOURCES = [
    ("events", "community.event"),
    ("announcements", "community.announcement"),
    ("event_rsvps", "community.rsvp"),
]


async def _gather_notifications(limit: int = 50) -> list[dict]:
    """Pull recent rows from community tables as notification items.

    Each source is a slow upstream query; run them concurrently rather than
    serially (was the dominant cost — ~3x the latency of a single query).
    """
    per_table = max(limit // len(NOTIFICATION_SOURCES), 5)

    async def _pull(table: str, event_type: str) -> list[dict]:
        try:
            result = await query_rows(table, sort={"created_at": -1}, limit=per_table)
        except Exception:
            return []
        out = []
        for row in result.get("data", []):
            flat = _flatten_row(row)
            flat["type"] = event_type
            out.append(flat)
        return out

    groups = await asyncio.gather(
        *(_pull(table, event_type) for table, event_type in NOTIFICATION_SOURCES)
    )
    items = [item for group in groups for item in group]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items[:limit]


@router.get("")
async def get_notifications(
    event_type: str | None = None,
    limit: int = 50,
    user: dict = Depends(current_user),
):
    user_id = str(user.get("id", ""))

    async def _load_reads() -> set:
        try:
            reads = await query_rows(
                READS_TABLE,
                filters={"user_id": {"$eq": user_id}},
                limit=1000,
            )
            return {r.get("event_id") or r.get("row_data", {}).get("event_id") for r in reads.get("data", [])}
        except Exception:
            return set()

    # The notification sources and the per-user read set are independent —
    # fetch them concurrently.
    items, read_ids = await asyncio.gather(
        _gather_notifications(limit=limit),
        _load_reads(),
    )

    if event_type:
        items = [i for i in items if i.get("type", "").startswith(event_type)]

    unread_count = 0
    for item in items:
        eid = str(item.get("id", ""))
        item["is_read"] = eid in read_ids
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
    items = await _gather_notifications(limit=200)

    try:
        reads = await query_rows(
            READS_TABLE,
            filters={"user_id": {"$eq": user_id}},
            limit=1000,
        )
        read_ids = {r.get("event_id") or r.get("row_data", {}).get("event_id") for r in reads.get("data", [])}
    except Exception:
        read_ids = set()

    marked = 0
    for item in items:
        eid = str(item.get("id", ""))
        if eid and eid not in read_ids:
            await insert_row(READS_TABLE, {"user_id": user_id, "event_id": eid})
            marked += 1
    return {"marked": marked}
