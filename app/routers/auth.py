import logging

from fastapi import APIRouter, Depends, Request

from app.config import settings
from app.deps import current_user, get_token
from app.models import (
    ForgotPasswordRequest,
    LoginRequest,
    OAuthCallbackRequest,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from app.proxy import forward
from app.zerodb import insert_row, query_rows

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Auth"])

MEMBER_TABLE = "member_directory"


async def _assign_tenant(result: dict) -> dict:
    if isinstance(result, dict):
        result["tenant"] = settings.tenant_name
    return result


async def _ensure_member_row(user_data: dict) -> None:
    user_id = str(user_data.get("id", ""))
    if not user_id:
        return
    try:
        existing = await query_rows(MEMBER_TABLE, filters={"user_id": {"$eq": user_id}}, limit=1)
        if existing.get("data"):
            return
        await insert_row(MEMBER_TABLE, {
            "user_id": user_id,
            "display_name": user_data.get("full_name") or user_data.get("name") or user_data.get("email", ""),
            "email": user_data.get("email", ""),
            "skills": [],
            "github": "",
            "availability": "open_to_collab",
        })
    except Exception as exc:
        logger.warning("Failed to seed member_directory row: %s", exc)


@router.post("/register")
async def register(body: RegisterRequest):
    payload = body.model_dump()
    payload["tenant"] = settings.tenant_name
    result = await forward("POST", "/v1/auth/register", json=payload)
    result = await _assign_tenant(result)
    user_info = result.get("user", {})
    if user_info:
        await _ensure_member_row(user_info)
    return result


@router.post("/login")
async def login(body: LoginRequest):
    result = await forward("POST", "/v1/auth/login", json=body.model_dump())
    result = await _assign_tenant(result)
    user_info = result.get("user", {})
    if user_info:
        await _ensure_member_row(user_info)
    return result


@router.post("/refresh")
async def refresh(body: RefreshRequest):
    return await forward("POST", "/v1/auth/refresh", json=body.model_dump())


@router.get("/me")
async def me(token: str = Depends(get_token)):
    result = await forward("GET", "/v1/auth/me", bearer_token=token)
    return await _assign_tenant(result)


@router.post("/logout")
async def logout(token: str = Depends(get_token)):
    return await forward("POST", "/v1/auth/logout", bearer_token=token)


@router.post("/oauth/{provider}/callback")
async def oauth_callback(provider: str, body: OAuthCallbackRequest):
    payload = body.model_dump()
    payload["tenant"] = settings.tenant_name
    result = await forward(
        "POST",
        f"/v1/auth/{provider}/callback",
        json=payload,
    )
    return await _assign_tenant(result)


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    return await forward("POST", "/v1/auth/forgot-password", json=body.model_dump())


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    return await forward("POST", "/v1/auth/reset-password", json=body.model_dump())
