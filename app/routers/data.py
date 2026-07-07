"""SC community data — lakehouse proxy endpoints.

Proxies queries to the AINative Lakehouse API so community developers
can access Santa Cruz local data (businesses, housing, economic, parcels,
traffic, crime) without direct lakehouse credentials.

Refs #21
"""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.config import settings
from app.deps import get_token
from app.proxy import forward


class LakehouseQueryBody(BaseModel):
    sql: str = Field(..., min_length=1, max_length=5000)
    max_rows: int = Field(1000, ge=1, le=10000)

router = APIRouter(prefix="/api/data", tags=["Community Data"])

_LAKE = f"/api/v1/projects/{settings.project_id}/database/lakehouse"

_SMB_PATH = "s3://ainative-lakehouse/raw/business/smb_businesses/date=*/data.parquet"
_HOUSING_PATH = "s3://ainative-lakehouse/raw/external/scc/zillow_zhvi/date=*/data.parquet"
_FRED_PATH = "s3://ainative-lakehouse/raw/external/scc/fred_indicators/date=*/data.parquet"
_PARCELS_PATH = "s3://ainative-lakehouse/raw/business/scc_parcels/date=*/data.parquet"
_TRAFFIC_PATH = "s3://ainative-lakehouse/raw/external/scc/caltrans_pems/date=*/data.parquet"
_CRIME_PATH = "s3://ainative-lakehouse/raw/external/scc/crimemapping/date=*/data.parquet"


@router.get("/tables")
async def list_tables(token: str = Depends(get_token)):
    return await forward("GET", f"{_LAKE}/tables", bearer_token=token)


@router.get("/stats")
async def get_stats(token: str = Depends(get_token)):
    return await forward("GET", f"{_LAKE}/stats", bearer_token=token)


@router.post("/query")
async def query_lakehouse(
    body: LakehouseQueryBody,
    token: str = Depends(get_token),
):
    return await forward(
        "POST", f"{_LAKE}/query", bearer_token=token,
        json=body.model_dump(),
    )


@router.get("/businesses")
async def list_businesses(
    q: str | None = Query(None, description="Search business name"),
    city: str | None = Query(None, description="Filter by city"),
    category: str | None = Query(None, description="Filter by industry category"),
    limit: int = Query(50, ge=1, le=1000),
    token: str = Depends(get_token),
):
    conditions = []
    if q:
        safe_q = q.replace("'", "''")
        conditions.append(f"business_name ILIKE '%{safe_q}%'")
    if city:
        safe_city = city.replace("'", "''")
        conditions.append(f"city ILIKE '{safe_city}'")
    if category:
        safe_cat = category.replace("'", "''")
        conditions.append(f"category ILIKE '%{safe_cat}%'")

    where = f" WHERE {' AND '.join(conditions)}" if conditions else ""
    sql = (
        f"SELECT business_name, dba, category, naics, address, city, state, zip, "
        f"phone, business_type, is_tech "
        f"FROM '{_SMB_PATH}'{where} "
        f"ORDER BY business_name LIMIT {limit}"
    )
    return await forward(
        "POST", f"{_LAKE}/query", bearer_token=token,
        json={"sql": sql, "max_rows": limit},
    )


@router.get("/housing")
async def housing_trends(
    limit: int = Query(200, ge=1, le=5000),
    token: str = Depends(get_token),
):
    sql = (
        f"SELECT region, date, zhvi "
        f"FROM '{_HOUSING_PATH}' "
        f"ORDER BY date DESC LIMIT {limit}"
    )
    return await forward(
        "POST", f"{_LAKE}/query", bearer_token=token,
        json={"sql": sql, "max_rows": limit},
    )


@router.get("/economic")
async def economic_indicators(
    series_id: str | None = Query(None, description="FRED series ID filter"),
    limit: int = Query(500, ge=1, le=5000),
    token: str = Depends(get_token),
):
    where = ""
    if series_id:
        safe_id = series_id.replace("'", "''")
        where = f" WHERE series_id = '{safe_id}'"
    sql = (
        f"SELECT series_id, date, value "
        f"FROM '{_FRED_PATH}'{where} "
        f"ORDER BY date DESC LIMIT {limit}"
    )
    return await forward(
        "POST", f"{_LAKE}/query", bearer_token=token,
        json={"sql": sql, "max_rows": limit},
    )


@router.get("/parcels")
async def list_parcels(
    city: str | None = Query(None, description="Filter by city"),
    limit: int = Query(100, ge=1, le=5000),
    token: str = Depends(get_token),
):
    where = ""
    if city:
        safe_city = city.replace("'", "''")
        where = f" WHERE city ILIKE '{safe_city}'"
    sql = (
        f"SELECT apn, address, full_address, city, zip, use_description, "
        f"zoning, base_zoning, homeowner_exempt "
        f"FROM '{_PARCELS_PATH}'{where} "
        f"ORDER BY apn LIMIT {limit}"
    )
    return await forward(
        "POST", f"{_LAKE}/query", bearer_token=token,
        json={"sql": sql, "max_rows": limit},
    )


@router.get("/traffic")
async def traffic_counts(
    route: str | None = Query(None, description="Filter by highway route"),
    limit: int = Query(200, ge=1, le=5000),
    token: str = Depends(get_token),
):
    where = ""
    if route:
        safe_route = route.replace("'", "''")
        where = f" WHERE route = '{safe_route}'"
    sql = (
        f"SELECT route, district, post_mile, back_aadt, ahead_aadt, "
        f"latitude, longitude "
        f"FROM '{_TRAFFIC_PATH}'{where} "
        f"ORDER BY route LIMIT {limit}"
    )
    return await forward(
        "POST", f"{_LAKE}/query", bearer_token=token,
        json={"sql": sql, "max_rows": limit},
    )


@router.get("/safety")
async def safety_incidents(
    incident_type: str | None = Query(None, description="Filter by incident type"),
    limit: int = Query(200, ge=1, le=5000),
    token: str = Depends(get_token),
):
    where = ""
    if incident_type:
        safe_type = incident_type.replace("'", "''")
        where = f" WHERE type ILIKE '%{safe_type}%'"
    sql = (
        f"SELECT type, description, date, address, latitude, longitude, agency "
        f"FROM '{_CRIME_PATH}'{where} "
        f"ORDER BY date DESC LIMIT {limit}"
    )
    return await forward(
        "POST", f"{_LAKE}/query", bearer_token=token,
        json={"sql": sql, "max_rows": limit},
    )
