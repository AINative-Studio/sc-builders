from fastapi import APIRouter, Depends

from app.deps import current_user
from app.zerodb import list_events

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    event_type: str | None = None,
    limit: int = 50,
    user: dict = Depends(current_user),
):
    return await list_events(event_type=event_type, limit=limit)
