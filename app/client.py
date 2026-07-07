import httpx

from app.config import settings

_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(
            base_url=settings.ainative_base_url,
            timeout=30.0,
            headers={"X-API-Key": settings.ainative_api_key},
        )
    return _client


async def close_client() -> None:
    global _client
    if _client and not _client.is_closed:
        await _client.aclose()
        _client = None


async def api_request(
    method: str,
    path: str,
    *,
    bearer_token: str | None = None,
    json: dict | None = None,
    params: dict | None = None,
) -> httpx.Response:
    client = get_client()
    headers: dict[str, str] = {}
    if bearer_token:
        headers["Authorization"] = f"Bearer {bearer_token}"
    return await client.request(
        method, path, headers=headers, json=json, params=params
    )
