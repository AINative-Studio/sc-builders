from fastapi import APIRouter, Depends

from app.deps import current_user, get_token, require_organizer
from app.models import EventCreate, EventUpdate, RSVPRequest
from app.proxy import forward

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.post("", status_code=201)
async def create_event(
    body: EventCreate,
    user: dict = Depends(require_organizer),
    token: str = Depends(get_token),
):
    return await forward(
        "POST",
        "/api/v1/community-events",
        bearer_token=token,
        json=body.model_dump(),
    )


@router.get("")
async def list_events(
    limit: int = 50,
    offset: int = 0,
    token: str = Depends(get_token),
):
    return await forward(
        "GET",
        "/api/v1/community-events",
        bearer_token=token,
        params={"limit": limit, "offset": offset},
    )


@router.get("/browse")
async def browse_events(
    limit: int = 50,
    offset: int = 0,
    token: str = Depends(get_token),
):
    return await forward(
        "GET",
        "/api/v1/community-events/browse",
        bearer_token=token,
        params={"limit": limit, "offset": offset},
    )


@router.get("/mine")
async def my_events(token: str = Depends(get_token)):
    return await forward(
        "GET", "/api/v1/community-events/my-events", bearer_token=token
    )


@router.get("/{event_id}")
async def get_event(event_id: str, token: str = Depends(get_token)):
    return await forward(
        "GET", f"/api/v1/community-events/{event_id}", bearer_token=token
    )


@router.patch("/{event_id}")
async def update_event(
    event_id: str,
    body: EventUpdate,
    user: dict = Depends(require_organizer),
    token: str = Depends(get_token),
):
    return await forward(
        "PATCH",
        f"/api/v1/community-events/{event_id}",
        bearer_token=token,
        json=body.model_dump(exclude_none=True),
    )


@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    user: dict = Depends(require_organizer),
    token: str = Depends(get_token),
):
    return await forward(
        "DELETE",
        f"/api/v1/community-events/{event_id}",
        bearer_token=token,
    )


@router.post("/{event_id}/rsvp")
async def rsvp(
    event_id: str,
    body: RSVPRequest,
    user: dict = Depends(current_user),
    token: str = Depends(get_token),
):
    return await forward(
        "POST",
        f"/api/v1/community-events/{event_id}/rsvp",
        bearer_token=token,
        json=body.model_dump(),
    )


@router.get("/{event_id}/attendees")
async def get_attendees(event_id: str, token: str = Depends(get_token)):
    return await forward(
        "GET",
        f"/api/v1/community-events/{event_id}/attendees",
        bearer_token=token,
    )


@router.get("/{event_id}/ical")
async def export_ical(event_id: str, token: str = Depends(get_token)):
    return await forward(
        "GET",
        f"/api/v1/community-events/{event_id}/export/ical",
        bearer_token=token,
    )
