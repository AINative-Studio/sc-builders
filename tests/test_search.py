import httpx

from app.config import settings
from tests.conftest import AUTH_HEADER


class TestSearch:
    def test_search_success(self, client, mock_api):
        mock_api.get("/api/v1/community/search").mock(
            return_value=httpx.Response(200, json={"results": [], "total": 0})
        )
        r = client.get("/api/search?q=python", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert "results" in r.json()

    def test_search_with_type(self, client, mock_api):
        mock_api.get("/api/v1/community/search").mock(
            return_value=httpx.Response(200, json={"results": []})
        )
        r = client.get(
            "/api/search?q=meetup&search_type=events",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_search_empty_query(self, client, mock_api):
        mock_api.get("/api/v1/community/search").mock(
            return_value=httpx.Response(200, json={"results": []})
        )
        r = client.get("/api/search", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_search_pagination(self, client, mock_api):
        mock_api.get("/api/v1/community/search").mock(
            return_value=httpx.Response(200, json={"results": [], "total": 100})
        )
        r = client.get(
            "/api/search?q=test&limit=10&offset=20",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_search_no_auth(self, client, mock_api):
        r = client.get("/api/search?q=test")
        assert r.status_code == 422


class TestSemanticSearch:
    def test_semantic_search_success(self, client, mock_api):
        mock_api.post(
            f"/api/v1/projects/{settings.project_id}/vectors/announcements/search"
        ).mock(
            return_value=httpx.Response(200, json={"results": [{"id": "ann-1", "score": 0.95}]})
        )
        r = client.get("/api/search/semantic?q=meetup", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert len(r.json()["results"]) == 1

    def test_semantic_search_custom_collection(self, client, mock_api):
        mock_api.post(
            f"/api/v1/projects/{settings.project_id}/vectors/messages/search"
        ).mock(
            return_value=httpx.Response(200, json={"results": []})
        )
        r = client.get(
            "/api/search/semantic?q=hello&collection=messages&limit=5",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_semantic_search_no_auth(self, client, mock_api):
        r = client.get("/api/search/semantic?q=test")
        assert r.status_code == 422
