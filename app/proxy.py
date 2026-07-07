from fastapi import HTTPException

from app.client import api_request


async def forward(
    method: str,
    upstream_path: str,
    *,
    bearer_token: str | None = None,
    json: dict | None = None,
    params: dict | None = None,
    expected_status: int = 200,
) -> dict:
    r = await api_request(
        method, upstream_path, bearer_token=bearer_token, json=json, params=params
    )
    if r.status_code >= 400:
        try:
            detail = r.json()
        except Exception:
            detail = r.text
        raise HTTPException(status_code=r.status_code, detail=detail)
    return r.json()
