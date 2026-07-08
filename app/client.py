import httpx

from app.config import settings

_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        # NOTE: X-API-Key is deliberately NOT a default header. The platform
        # prioritizes X-API-Key over a user Bearer token, so sending both makes
        # every authenticated request resolve to the API key's (admin) identity.
        # The key is attached per-request only when there is no user token.
        _client = httpx.AsyncClient(
            base_url=settings.ainative_base_url,
            timeout=30.0,
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
        # User-authenticated call: forward the user's token ALONE so the platform
        # resolves the real user (X-API-Key would override it with admin).
        headers["Authorization"] = f"Bearer {bearer_token}"
    else:
        # Service/unauthenticated call (e.g. lakehouse queries): use the API key.
        headers["X-API-Key"] = settings.ainative_api_key
    return await client.request(
        method, path, headers=headers, json=json, params=params
    )
