"""SC community search — keyword + semantic + prospect.

Refs #37
"""

import logging

from fastapi import APIRouter, Depends, Query

from app.client import api_request
from app.config import settings
from app.deps import get_token
from app.proxy import forward
from app.zerodb import query_rows, search_embeddings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["Search"])

_LAKE = f"/api/v1/projects/{settings.project_id}/database/lakehouse"

_SEARCHABLE_TABLES = ["announcements", "channels", "events", "member_directory"]

SC_COUNTY_CITIES = [
    "Santa Cruz", "Capitola", "Watsonville", "Scotts Valley",
    "Aptos", "Soquel", "Ben Lomond", "Felton", "Boulder Creek",
    "Davenport", "La Selva Beach", "Live Oak",
]


@router.get("")
async def keyword_search(
    q: str = Query("", min_length=1, description="Search query"),
    search_type: str = Query("all", description="Table to search, or 'all'"),
    limit: int = Query(20, ge=1, le=100),
    token: str = Depends(get_token),
):
    tables = [search_type] if search_type != "all" else _SEARCHABLE_TABLES
    results: dict[str, list] = {}
    for table in tables:
        try:
            resp = await query_rows(
                table,
                filters={"$text": {"$search": q}},
                limit=limit,
                bearer_token=token,
            )
            items = [
                row.get("row_data", row) for row in resp.get("data", [])
            ]
            if items:
                results[table] = items
        except Exception:
            logger.debug("Keyword search on %s failed, skipping", table)
    return {"query": q, "results": results, "total": sum(len(v) for v in results.values())}


@router.get("/semantic")
async def semantic_search(
    q: str = Query(..., min_length=1, description="Natural language query"),
    collection: str = Query("default", description="Embedding collection"),
    limit: int = Query(10, ge=1, le=50),
    token: str = Depends(get_token),
):
    try:
        return await search_embeddings(q, collection=collection, limit=limit)
    except Exception:
        logger.exception("Semantic search failed for q=%s", q)
        return {"results": [], "query": q, "total_results": 0, "error": "Search temporarily unavailable"}


@router.get("/prospect")
async def prospect_search(
    q: str = Query(..., min_length=1, description="Natural language query"),
    limit: int = Query(10, ge=1, le=50),
    token: str = Depends(get_token),
):
    try:
        resp = await api_request(
            "POST",
            "/api/v1/public/data/prospect",
            json={"query": q, "limit": limit * 3},
            bearer_token=token,
        )
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        logger.exception("Prospect search failed for q=%s", q)
        return {"query": q, "results": [], "total": 0}

    sc_cities_lower = {c.lower() for c in SC_COUNTY_CITIES}
    filtered = [
        r for r in data.get("results", [])
        if (r.get("city") or "").lower() in sc_cities_lower
    ][:limit]

    return {
        "query": q,
        "results": filtered,
        "total": len(filtered),
        "model": data.get("model"),
    }


@router.get("/lakehouse")
async def lakehouse_search(
    q: str = Query(..., min_length=1, description="Search query for lakehouse data"),
    dataset: str = Query("businesses", description="Dataset: businesses, parcels, safety"),
    limit: int = Query(20, ge=1, le=200),
    token: str = Depends(get_token),
):
    safe_q = q.replace("'", "''")
    from app.routers.data import _SMB_PATH, _PARCELS_PATH, _CRIME_PATH, _SC_CITY_SQL

    if dataset == "businesses":
        sql = (
            f"SELECT business_name, category, address, city, phone, is_tech "
            f"FROM '{_SMB_PATH}' "
            f"WHERE ({_SC_CITY_SQL}) AND business_name ILIKE '%{safe_q}%' "
            f"ORDER BY business_name LIMIT {limit}"
        )
    elif dataset == "parcels":
        sql = (
            f"SELECT apn, address, city, use_description, zoning "
            f"FROM '{_PARCELS_PATH}' "
            f"WHERE address ILIKE '%{safe_q}%' OR use_description ILIKE '%{safe_q}%' "
            f"ORDER BY apn LIMIT {limit}"
        )
    elif dataset == "safety":
        sql = (
            f"SELECT type, description, date, address, agency "
            f"FROM '{_CRIME_PATH}' "
            f"WHERE description ILIKE '%{safe_q}%' OR type ILIKE '%{safe_q}%' "
            f"ORDER BY date DESC LIMIT {limit}"
        )
    else:
        return {"error": f"Unknown dataset: {dataset}", "valid": ["businesses", "parcels", "safety"]}

    return await forward(
        "POST", f"{_LAKE}/query", bearer_token=token,
        json={"sql": sql, "max_rows": limit},
    )
