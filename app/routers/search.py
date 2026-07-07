from fastapi import APIRouter, Depends

from app.deps import get_token
from app.proxy import forward

router = APIRouter(prefix="/api/search", tags=["Search"])


@router.get("")
async def search(
    q: str = "",
    search_type: str = "all",
    limit: int = 50,
    offset: int = 0,
    token: str = Depends(get_token),
):
    return await forward(
        "GET",
        "/api/v1/community/search",
        bearer_token=token,
        params={
            "q": q,
            "search_type": search_type,
            "limit": limit,
            "offset": offset,
        },
    )
