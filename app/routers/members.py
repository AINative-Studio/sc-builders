from fastapi import APIRouter, Depends, HTTPException

from app.deps import current_user
from app.models import MemberProfileUpdate
from app.pagination import paginate
from app.zerodb import insert_row, query_rows, update_row

router = APIRouter(prefix="/api/members", tags=["Members"])

TABLE = "member_directory"


@router.get("")
async def list_members(
    skill: str | None = None,
    availability: str | None = None,
    limit: int = 50,
    skip: int = 0,
):
    filters: dict = {}
    if skill:
        filters["skills"] = {"$contains": skill}
    if availability:
        filters["availability"] = {"$eq": availability}
    result = await query_rows(TABLE, filters=filters if filters else None, limit=limit, skip=skip)
    return paginate(result, limit=limit, skip=skip)


@router.get("/me")
async def get_my_profile(user: dict = Depends(current_user)):
    user_id = str(user.get("id", ""))
    result = await query_rows(TABLE, filters={"user_id": {"$eq": user_id}}, limit=1)
    rows = result.get("data", [])
    if not rows:
        return {"user_id": user_id, "display_name": user.get("full_name", ""), "skills": [], "github": "", "availability": ""}
    return rows[0]


@router.get("/{user_id}")
async def get_member(user_id: str):
    result = await query_rows(TABLE, filters={"user_id": {"$eq": user_id}}, limit=1)
    rows = result.get("data", [])
    if not rows:
        raise HTTPException(status_code=404, detail="Member not found")
    return rows[0]


@router.patch("/me")
async def update_my_profile(
    body: MemberProfileUpdate,
    user: dict = Depends(current_user),
):
    user_id = str(user.get("id", ""))
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    existing = await query_rows(TABLE, filters={"user_id": {"$eq": user_id}}, limit=1)
    rows = existing.get("data", [])

    if rows:
        row_id = rows[0].get("id") or rows[0].get("_id") or rows[0].get("row_id") or rows[0].get("_row_id")
        if not row_id:
            raise HTTPException(status_code=500, detail="Could not resolve member row id")
        return await update_row(TABLE, str(row_id), updates)

    row_data = {"user_id": user_id, "display_name": "", "skills": [], "github": "", "availability": ""}
    row_data.update(updates)
    return await insert_row(TABLE, row_data)
