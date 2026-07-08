"""Intent casting — proxy to the AINative platform intent-casting API.

The AINative platform already provides intent casting (natural-language intents
matched to agents/businesses) and the Beckn protocol. Rather than reimplement,
we proxy to `/api/v1/public/intents*` the same way the data router proxies the
lakehouse. Despite the `/public/` prefix, the upstream requires the user's
bearer token, which we forward.

Refs #41
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.deps import current_user, get_token
from app.proxy import forward

router = APIRouter(prefix="/api/intents", tags=["Intents"])

_UP = "/api/v1/public/intents"


class IntentCreateBody(BaseModel):
    text: str = Field(..., min_length=1, description="Natural language intent")
    category: str | None = Field(None, description="Override auto-detected category")
    max_matches: int = Field(5, ge=1, le=50, description="Max matches to return")
    auto_negotiate: bool = Field(False, description="Let agents auto-negotiate on your behalf")


class IntentActionBody(BaseModel):
    action: str = Field(..., description="accept or reject")
    message: str | None = Field(None, max_length=500, description="Optional message to the business agent")


@router.post("", status_code=201)
async def create_intent(
    body: IntentCreateBody,
    user: dict = Depends(current_user),
    token: str = Depends(get_token),
):
    return await forward(
        "POST", _UP, bearer_token=token,
        json=body.model_dump(exclude_none=True),
        expected_status=201,
    )


@router.get("")
async def list_intents(
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    user: dict = Depends(current_user),
    token: str = Depends(get_token),
):
    return await forward(
        "GET", _UP, bearer_token=token,
        params={"limit": limit, "skip": skip},
    )


@router.get("/{intent_id}")
async def get_intent(
    intent_id: str,
    user: dict = Depends(current_user),
    token: str = Depends(get_token),
):
    return await forward("GET", f"{_UP}/{intent_id}", bearer_token=token)


@router.post("/{intent_id}/action/{match_agent_id}")
async def intent_action(
    intent_id: str,
    match_agent_id: str,
    body: IntentActionBody,
    user: dict = Depends(current_user),
    token: str = Depends(get_token),
):
    return await forward(
        "POST", f"{_UP}/{intent_id}/action/{match_agent_id}",
        bearer_token=token, json=body.model_dump(exclude_none=True),
    )
