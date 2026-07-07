from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.deps import current_user, require_organizer
from app.models import EventCreate, EventUpdate, RSVPRequest
from app.pagination import paginate
from app.zerodb import delete_row, emit_event, insert_row, query_rows, update_row

router = APIRouter(prefix="/api/events", tags=["Events"])

TABLE = "events"
RSVP_TABLE = "event_rsvps"


@router.post("", status_code=201)
async def create_event(
    body: EventCreate,
    user: dict = Depends(require_organizer),
):
    user_id = str(user.get("id", ""))
    row = {
        "title": body.title,
        "description": body.description,
        "location": body.location,
        "starts_at": body.starts_at,
        "ends_at": body.ends_at,
        "max_attendees": body.max_attendees,
        "created_by": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "upcoming",
    }
    result = await insert_row(TABLE, row)

    await emit_event(
        "community.event.created",
        {"title": body.title, "created_by": user_id},
    )
    return result


@router.get("")
async def list_events(limit: int = 50, skip: int = 0):
    result = await query_rows(
        TABLE,
        sort={"starts_at": 1},
        limit=limit,
        skip=skip,
    )
    return paginate(result, limit=limit, skip=skip)


@router.get("/{event_id}")
async def get_event(event_id: str):
    from app.pagination import _flatten_row

    result = await query_rows(TABLE, filters={}, limit=200)
    rows = result.get("data", [])
    for row in rows:
        rid = row.get("row_id", row.get("id", ""))
        if str(rid) == event_id:
            return _flatten_row(row)
    raise HTTPException(status_code=404, detail="Event not found")


@router.patch("/{event_id}")
async def update_event(
    event_id: str,
    body: EventUpdate,
    user: dict = Depends(require_organizer),
):
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    return await update_row(TABLE, event_id, updates)


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    user: dict = Depends(require_organizer),
):
    return await delete_row(TABLE, event_id)


@router.post("/{event_id}/rsvp")
async def rsvp(
    event_id: str,
    body: RSVPRequest,
    user: dict = Depends(current_user),
):
    user_id = str(user.get("id", ""))

    existing = await query_rows(
        RSVP_TABLE,
        filters={"event_id": {"$eq": event_id}, "user_id": {"$eq": user_id}},
        limit=1,
    )
    rows = existing.get("data", [])

    if rows:
        row_id = rows[0].get("id") or rows[0].get("_id") or rows[0].get("row_id")
        return await update_row(RSVP_TABLE, str(row_id), {"status": body.status})

    row = {
        "event_id": event_id,
        "user_id": user_id,
        "user_name": user.get("full_name") or user.get("name") or user.get("email", ""),
        "status": body.status,
        "rsvped_at": datetime.now(timezone.utc).isoformat(),
    }
    return await insert_row(RSVP_TABLE, row)


@router.get("/{event_id}/attendees")
async def get_attendees(event_id: str, limit: int = 100, skip: int = 0):
    result = await query_rows(
        RSVP_TABLE,
        filters={"event_id": {"$eq": event_id}},
        limit=limit,
        skip=skip,
    )
    return paginate(result, limit=limit, skip=skip)
