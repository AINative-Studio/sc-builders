from fastapi import APIRouter, Depends, HTTPException

from app.deps import current_user, get_token
from app.models import CommentCreate
from app.proxy import forward

router = APIRouter(prefix="/api/comments", tags=["Comments"])


@router.post("", status_code=201)
async def create_comment(
    body: CommentCreate,
    user: dict = Depends(current_user),
    token: str = Depends(get_token),
):
    return await forward(
        "POST",
        "/api/v1/community/comments",
        bearer_token=token,
        json={
            "content": body.content,
            "content_type": body.content_type,
            "content_id": body.content_id,
        },
    )


@router.get("/{content_type}/{content_id}")
async def list_comments(
    content_type: str,
    content_id: str,
    limit: int = 50,
    offset: int = 0,
):
    return await forward(
        "GET",
        f"/api/v1/community/comments/{content_type}/{content_id}",
        params={"limit": limit, "offset": offset},
    )


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: str,
    user: dict = Depends(current_user),
    token: str = Depends(get_token),
):
    return await forward(
        "DELETE",
        f"/api/v1/community/comments/{comment_id}",
        bearer_token=token,
    )
