import httpx

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
