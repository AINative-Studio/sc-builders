"""Tests for the SC community data (lakehouse proxy) endpoints."""

import httpx
import pytest
import respx

from app.config import settings
from tests.conftest import AUTH_HEADER

LAKE_BASE = f"/api/v1/projects/{settings.project_id}/database/lakehouse"


class TestDataTables:
    def test_list_tables(self, client, mock_api):
        mock_api.get(f"{LAKE_BASE}/tables").mock(
            return_value=httpx.Response(200, json=[
                {"name": "external/scc/zillow_zhvi", "format": "parquet", "file_count": 3, "total_bytes": 12345},
                {"name": "external/scc/edd_labor", "format": "parquet", "file_count": 2, "total_bytes": 9876},
            ])
        )
        r = client.get("/api/data/tables", headers=AUTH_HEADER)
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body, list)
        assert len(body) == 2
        assert body[0]["name"] == "external/scc/zillow_zhvi"

    def test_list_tables_no_auth(self, client, mock_api):
        r = client.get("/api/data/tables")
        assert r.status_code == 422

    def test_list_tables_upstream_error(self, client, mock_api):
        mock_api.get(f"{LAKE_BASE}/tables").mock(
            return_value=httpx.Response(500, json={"detail": "Internal error"})
        )
        r = client.get("/api/data/tables", headers=AUTH_HEADER)
        assert r.status_code == 500


class TestDataStats:
    def test_get_stats(self, client, mock_api):
        mock_api.get(f"{LAKE_BASE}/stats").mock(
            return_value=httpx.Response(200, json={
                "total_files": 42,
                "total_bytes": 999999,
                "sensor_types": 10,
                "tables": [
                    {"name": "external/scc/zillow_zhvi", "format": "parquet", "file_count": 3, "total_bytes": 12345},
                ],
            })
        )
        r = client.get("/api/data/stats", headers=AUTH_HEADER)
        assert r.status_code == 200
        body = r.json()
        assert body["total_files"] == 42
        assert "tables" in body

    def test_get_stats_no_auth(self, client, mock_api):
        r = client.get("/api/data/stats")
        assert r.status_code == 422


class TestDataQuery:
    def test_query_success(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["date", "zhvi"],
                "rows": [["2026-01-01", 950000]],
                "row_count": 1,
                "execution_time_ms": 42.5,
                "truncated": False,
            })
        )
        r = client.post(
            "/api/data/query",
            json={"sql": "SELECT date, zhvi FROM 's3://ainative-lakehouse/raw/external/scc/zillow_zhvi/date=2026-01-01/data.parquet' LIMIT 10"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200
        body = r.json()
        assert body["columns"] == ["date", "zhvi"]
        assert body["row_count"] == 1

    def test_query_custom_max_rows(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["id"], "rows": [], "row_count": 0,
                "execution_time_ms": 1.0, "truncated": False,
            })
        )
        r = client.post(
            "/api/data/query",
            json={"sql": "SELECT 1", "max_rows": 500},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_query_validation_no_sql(self, client, mock_api):
        r = client.post("/api/data/query", json={}, headers=AUTH_HEADER)
        assert r.status_code == 422

    def test_query_no_auth(self, client, mock_api):
        r = client.post("/api/data/query", json={"sql": "SELECT 1"})
        assert r.status_code == 422

    def test_query_upstream_400(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(400, json={"detail": "Forbidden SQL"})
        )
        r = client.post(
            "/api/data/query",
            json={"sql": "DROP TABLE foo"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 400

    def test_query_upstream_429(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(429, json={"detail": "Rate limit exceeded"})
        )
        r = client.post(
            "/api/data/query",
            json={"sql": "SELECT 1"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 429


class TestDataBusinesses:
    def test_list_businesses(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["business_name", "category", "city", "address"],
                "rows": [["Joe's Coffee", "Food", "Santa Cruz", "123 Pacific Ave"]],
                "row_count": 1,
                "execution_time_ms": 55.0,
                "truncated": False,
            })
        )
        r = client.get("/api/data/businesses", headers=AUTH_HEADER)
        assert r.status_code == 200
        body = r.json()
        assert "rows" in body
        assert body["row_count"] == 1
        # Enriched with human column metadata + dataset description.
        assert body["dataset"] == "businesses"
        assert body["description"]
        labels = {f["key"]: f["label"] for f in body["fields"]}
        assert labels["business_name"] == "Business"
        assert labels["category"] == "Category"

    def test_list_businesses_sc_filter_applied(self, client, mock_api):
        route = mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["business_name"], "rows": [],
                "row_count": 0, "execution_time_ms": 10.0, "truncated": False,
            })
        )
        client.get("/api/data/businesses", headers=AUTH_HEADER)
        sent_sql = route.calls[0].request.content.decode()
        assert "Santa Cruz" in sent_sql
        assert "Capitola" in sent_sql
        assert "Watsonville" in sent_sql

    def test_list_businesses_with_filters(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["business_name", "category", "city"],
                "rows": [], "row_count": 0,
                "execution_time_ms": 10.0, "truncated": False,
            })
        )
        r = client.get(
            "/api/data/businesses?city=Capitola&category=Food&limit=25",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_list_businesses_search(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["business_name"], "rows": [["Acme Tech"]],
                "row_count": 1, "execution_time_ms": 20.0, "truncated": False,
            })
        )
        r = client.get("/api/data/businesses?q=Acme", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["row_count"] == 1


class TestDataHousing:
    def test_housing_trends(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["region", "date", "zhvi"],
                "rows": [["Santa Cruz", "2026-01-01", 950000]],
                "row_count": 1,
                "execution_time_ms": 30.0, "truncated": False,
            })
        )
        r = client.get("/api/data/housing", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["row_count"] >= 1


class TestDataEconomic:
    def test_economic_indicators(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["series_id", "date", "value"],
                "rows": [
                    ["CASANT3URN", "2026-01-01", 4.2],
                    ["CASANT3URN", "2025-12-01", 4.4],
                    ["CASANT3POP", "2026-01-01", 274.8],
                ],
                "row_count": 3,
                "execution_time_ms": 50.0, "truncated": False,
            })
        )
        r = client.get("/api/data/economic", headers=AUTH_HEADER)
        assert r.status_code == 200
        body = r.json()
        # Enriched: grouped into labelled series with units + latest value.
        assert body["dataset"] == "economic"
        assert body["description"]
        series = {s["series_id"]: s for s in body["series"]}
        assert series["CASANT3URN"]["label"] == "Unemployment Rate"
        assert series["CASANT3URN"]["unit"] == "%"
        assert series["CASANT3URN"]["latest"] == 4.2
        assert series["CASANT3URN"]["count"] == 2
        assert series["CASANT3POP"]["label"] == "Resident Population"

    def test_economic_with_series(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["series_id", "date", "value"],
                "rows": [], "row_count": 0,
                "execution_time_ms": 10.0, "truncated": False,
            })
        )
        r = client.get(
            "/api/data/economic?series_id=CASANC0URN",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200


class TestDataParcels:
    def test_list_parcels(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["apn", "address", "city", "use_description"],
                "rows": [["123-456-78", "100 Main St", "Santa Cruz", "Single Family"]],
                "row_count": 1,
                "execution_time_ms": 80.0, "truncated": False,
            })
        )
        r = client.get("/api/data/parcels", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["row_count"] == 1

    def test_parcels_with_city_filter(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["apn"], "rows": [], "row_count": 0,
                "execution_time_ms": 5.0, "truncated": False,
            })
        )
        r = client.get("/api/data/parcels?city=Watsonville", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestDataTraffic:
    def test_traffic_counts(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["route", "back_aadt", "ahead_aadt"],
                "rows": [["1", 15000, 14500]],
                "row_count": 1,
                "execution_time_ms": 35.0, "truncated": False,
            })
        )
        r = client.get("/api/data/traffic", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["row_count"] == 1


class TestDataSafety:
    def test_crime_incidents(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["type", "date", "address"],
                "rows": [["Theft", "2026-06-01", "100 Pacific Ave"]],
                "row_count": 1,
                "execution_time_ms": 25.0, "truncated": False,
            })
        )
        r = client.get("/api/data/safety", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["row_count"] == 1

    def test_safety_with_type_filter(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["type", "date"], "rows": [], "row_count": 0,
                "execution_time_ms": 5.0, "truncated": False,
            })
        )
        r = client.get("/api/data/safety?incident_type=Vandalism", headers=AUTH_HEADER)
        assert r.status_code == 200
