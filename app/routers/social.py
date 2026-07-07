from fastapi import APIRouter, Depends

from app.deps import current_user, get_token
from app.proxy import forward

router = APIRouter(prefix="/api/social", tags=["Social"])


@router.post("/follow/{uid}")
async def follow(uid: str, user: dict = Depends(current_user), token: str = Depends(get_token)):
    return await forward("POST", f"/api/v1/social/follow/{uid}", bearer_token=token)


@router.delete("/follow/{uid}")
async def unfollow(uid: str, user: dict = Depends(current_user), token: str = Depends(get_token)):
    return await forward("DELETE", f"/api/v1/social/follow/{uid}", bearer_token=token)


@router.post("/friend-request/{uid}")
async def send_friend_request(uid: str, user: dict = Depends(current_user), token: str = Depends(get_token)):
    return await forward("POST", f"/api/v1/social/friend-request/{uid}", bearer_token=token)


@router.post("/friend-request/{req_id}/accept")
async def accept_friend(req_id: str, user: dict = Depends(current_user), token: str = Depends(get_token)):
    return await forward("POST", f"/api/v1/social/{req_id}/accept", bearer_token=token)


@router.post("/friend-request/{req_id}/decline")
async def decline_friend(req_id: str, user: dict = Depends(current_user), token: str = Depends(get_token)):
    return await forward("POST", f"/api/v1/social/{req_id}/decline", bearer_token=token)


@router.delete("/friend-request/{req_id}")
async def cancel_friend_request(req_id: str, user: dict = Depends(current_user), token: str = Depends(get_token)):
    return await forward("DELETE", f"/api/v1/social/friend-request/{req_id}", bearer_token=token)


@router.post("/block/{uid}")
async def block(uid: str, user: dict = Depends(current_user), token: str = Depends(get_token)):
    return await forward("POST", f"/api/v1/social/block/{uid}", bearer_token=token)


@router.post("/ignore/{uid}")
async def ignore(uid: str, user: dict = Depends(current_user), token: str = Depends(get_token)):
    return await forward("POST", f"/api/v1/social/ignore/{uid}", bearer_token=token)


@router.get("/{uid}/followers")
async def followers(uid: str, token: str = Depends(get_token)):
    return await forward("GET", f"/api/v1/social/{uid}/followers", bearer_token=token)


@router.get("/{uid}/following")
async def following(uid: str, token: str = Depends(get_token)):
    return await forward("GET", f"/api/v1/social/{uid}/following", bearer_token=token)


@router.get("/{uid}/friends")
async def friends(uid: str, token: str = Depends(get_token)):
    return await forward("GET", f"/api/v1/social/{uid}/friends", bearer_token=token)


@router.get("/me/friend-requests")
async def my_friend_requests(user: dict = Depends(current_user), token: str = Depends(get_token)):
    return await forward("GET", "/api/v1/social/me/friend-requests", bearer_token=token)


@router.get("/me/stats")
async def my_stats(user: dict = Depends(current_user), token: str = Depends(get_token)):
    return await forward("GET", "/api/v1/social/me/stats", bearer_token=token)
