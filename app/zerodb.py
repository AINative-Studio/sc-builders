from app.client import api_request
from app.config import settings


def _table_path(table: str) -> str:
    return f"/api/v1/projects/{settings.project_id}/database/tables/{table}"


async def create_table(name: str, *, bearer_token: str | None = None) -> dict:
    path = f"/api/v1/projects/{settings.project_id}/database/tables"
    r = await api_request("POST", path, json={"name": name}, bearer_token=bearer_token)
    r.raise_for_status()
    return r.json()


async def insert_row(table: str, row_data: dict, *, bearer_token: str | None = None) -> dict:
    path = f"{_table_path(table)}/rows"
    r = await api_request("POST", path, json={"row_data": row_data}, bearer_token=bearer_token)
    r.raise_for_status()
    return r.json()


async def query_rows(
    table: str,
    *,
    filters: dict | None = None,
    sort: dict | None = None,
    limit: int = 50,
    skip: int = 0,
    bearer_token: str | None = None,
) -> dict:
    path = f"{_table_path(table)}/query"
    body: dict = {"limit": limit, "skip": skip}
    if filters:
        body["filters"] = filters
    if sort:
        body["sort"] = sort
    r = await api_request("POST", path, json=body, bearer_token=bearer_token)
    r.raise_for_status()
    return r.json()


async def get_row(table: str, row_id: str, *, bearer_token: str | None = None) -> dict:
    path = f"{_table_path(table)}/rows/{row_id}"
    r = await api_request("GET", path, bearer_token=bearer_token)
    r.raise_for_status()
    return r.json()


async def update_row(table: str, row_id: str, data: dict, *, bearer_token: str | None = None) -> dict:
    path = f"{_table_path(table)}/rows/{row_id}"
    # ZeroDB row updates are PUT, not PATCH (PATCH returns 405 Method Not Allowed).
    r = await api_request("PUT", path, json={"row_data": data}, bearer_token=bearer_token)
    r.raise_for_status()
    return r.json()


async def delete_row(table: str, row_id: str, *, bearer_token: str | None = None) -> dict:
    path = f"{_table_path(table)}/rows/{row_id}"
    r = await api_request("DELETE", path, bearer_token=bearer_token)
    r.raise_for_status()
    return r.json()


async def emit_event(event_type: str, data: dict, *, correlation_id: str | None = None) -> dict:
    """Fire-and-forget event emission. Never raises."""
    import logging

    logger = logging.getLogger(__name__)
    try:
        path = "/api/v1/public/zerodb/events"
        body: dict = {"type": event_type, "data": data, "source": "sc-builders"}
        if correlation_id:
            body["correlation_id"] = correlation_id
        r = await api_request("POST", path, json=body)
        r.raise_for_status()
        return r.json()
    except Exception:
        logger.debug("emit_event(%s) failed — endpoint may not exist, skipping", event_type)
        return {"ok": False, "event_type": event_type}


async def embed_and_store(
    text: str,
    *,
    collection: str = "default",
    source: str | None = None,
    model: str = "bge-m3",
    bearer_token: str | None = None,
) -> dict:
    path = f"/api/v1/projects/{settings.project_id}/embeddings/embed-and-store"
    body: dict = {"text": text, "collection": collection, "model": model}
    if source:
        body["source"] = source
    r = await api_request("POST", path, json=body, bearer_token=bearer_token)
    r.raise_for_status()
    return r.json()


async def search_embeddings(
    query: str,
    *,
    collection: str = "default",
    limit: int = 10,
    model: str = "bge-m3",
    bearer_token: str | None = None,
) -> dict:
    path = f"/api/v1/projects/{settings.project_id}/embeddings/search"
    body: dict = {"query": query, "collection": collection, "limit": limit, "model": model}
    r = await api_request("POST", path, json=body, bearer_token=bearer_token)
    r.raise_for_status()
    return r.json()


async def list_events(
    event_type: str | None = None,
    *,
    limit: int = 50,
    bearer_token: str | None = None,
) -> dict:
    path = "/api/v1/public/zerodb/events"
    params: dict = {"limit": limit}
    if event_type:
        params["type"] = event_type
    r = await api_request("GET", path, params=params, bearer_token=bearer_token)
    r.raise_for_status()
    return r.json()
