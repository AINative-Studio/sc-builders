import httpx

from app.config import settings
from tests.conftest import AUTH_HEADER

LAKE_BASE = f"/api/v1/projects/{settings.project_id}/database/lakehouse"


def _table_path(table):
    return f"/api/v1/projects/{settings.project_id}/database/tables/{table}"


def _embeddings_path():
    return f"/api/v1/projects/{settings.project_id}/embeddings/search"


class TestKeywordSearch:
    def test_search_all_tables(self, client, mock_api):
        for t in ["announcements", "channels", "events", "member_directory"]:
            mock_api.post(f"{_table_path(t)}/query").mock(
                return_value=httpx.Response(200, json={"data": [], "total": 0})
            )
        r = client.get("/api/search?q=python", headers=AUTH_HEADER)
        assert r.status_code == 200
        body = r.json()
        assert "results" in body
        assert "total" in body

    def test_search_single_table(self, client, mock_api):
        mock_api.post(f"{_table_path('events')}/query").mock(
            return_value=httpx.Response(200, json={
                "data": [{"id": "e1", "row_data": {"title": "Meetup"}}], "total": 1,
            })
        )
        r = client.get("/api/search?q=meetup&search_type=events", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["total"] == 1
        assert "events" in r.json()["results"]

    def test_search_no_auth(self, client, mock_api):
        r = client.get("/api/search?q=test")
        assert r.status_code == 422

    def test_search_empty_query(self, client, mock_api):
        r = client.get("/api/search?q=", headers=AUTH_HEADER)
        assert r.status_code == 422


class TestSemanticSearch:
    def test_semantic_success(self, client, mock_api):
        mock_api.post(_embeddings_path()).mock(
            return_value=httpx.Response(200, json={
                "results": [{"vector_id": "v1", "document": "test doc"}],
                "total_results": 1,
            })
        )
        r = client.get("/api/search/semantic?q=meetup", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert len(r.json()["results"]) == 1

    def test_semantic_custom_collection(self, client, mock_api):
        mock_api.post(_embeddings_path()).mock(
            return_value=httpx.Response(200, json={"results": [], "total_results": 0})
        )
        r = client.get(
            "/api/search/semantic?q=hello&collection=messages&limit=5",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_semantic_no_auth(self, client, mock_api):
        r = client.get("/api/search/semantic?q=test")
        assert r.status_code == 422


class TestProspectSearch:
    def test_prospect_filters_sc(self, client, mock_api):
        mock_api.post("/api/v1/public/data/prospect").mock(
            return_value=httpx.Response(200, json={
                "results": [
                    {"business_name": "SC Tech", "city": "Santa Cruz", "state": "CA"},
                    {"business_name": "LA Corp", "city": "Los Angeles", "state": "CA"},
                    {"business_name": "Cap Shop", "city": "Capitola", "state": "CA"},
                ],
                "total": 3,
            })
        )
        r = client.get("/api/search/prospect?q=tech", headers=AUTH_HEADER)
        assert r.status_code == 200
        body = r.json()
        assert body["total"] == 2
        cities = [res["city"] for res in body["results"]]
        assert "Los Angeles" not in cities
        assert "Santa Cruz" in cities
        assert "Capitola" in cities

    def test_prospect_no_auth(self, client, mock_api):
        r = client.get("/api/search/prospect?q=test")
        assert r.status_code == 422


class TestLakehouseSearch:
    def test_lakehouse_businesses(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["business_name", "category", "address", "city"],
                "rows": [["Joe's Coffee", "Food", "123 Pacific Ave", "Santa Cruz"]],
                "row_count": 1, "execution_time_ms": 50.0, "truncated": False,
            })
        )
        r = client.get("/api/search/lakehouse?q=coffee&dataset=businesses", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["row_count"] == 1

    def test_lakehouse_parcels(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["apn", "address"], "rows": [], "row_count": 0,
                "execution_time_ms": 10.0, "truncated": False,
            })
        )
        r = client.get("/api/search/lakehouse?q=main+st&dataset=parcels", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_lakehouse_safety(self, client, mock_api):
        mock_api.post(f"{LAKE_BASE}/query").mock(
            return_value=httpx.Response(200, json={
                "columns": ["type", "description"], "rows": [], "row_count": 0,
                "execution_time_ms": 5.0, "truncated": False,
            })
        )
        r = client.get("/api/search/lakehouse?q=theft&dataset=safety", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_lakehouse_unknown_dataset(self, client, mock_api):
        r = client.get("/api/search/lakehouse?q=test&dataset=unknown", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert "error" in r.json()

    def test_lakehouse_no_auth(self, client, mock_api):
        r = client.get("/api/search/lakehouse?q=test&dataset=businesses")
        assert r.status_code == 422
