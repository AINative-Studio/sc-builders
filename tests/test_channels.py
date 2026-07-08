import httpx

from app.config import settings
from tests.conftest import AUTH_HEADER, FAKE_USER, MEMBER_USER, stub_auth_me


def _table_prefix():
    return f"/api/v1/projects/{settings.project_id}/database/tables/channels"


CHANNEL_ROW = {
    "id": "row-1",
    "slug": "general",
    "name": "General",
    "topic": "",
    "stream_id": "stream-abc",
    "visibility": "public",
    "archived": False,
}


class TestCreateChannel:
    def test_create_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        mock_api.post(f"{_table_prefix()}/rows").mock(
            return_value=httpx.Response(200, json=CHANNEL_ROW)
        )
        mock_api.post("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post(
            "/api/channels",
            json={"slug": "general", "name": "General"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 201
        assert r.json()["slug"] == "general"

    def test_create_duplicate(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW]})
        )
        r = client.post(
            "/api/channels",
            json={"slug": "general", "name": "General"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 409

    def test_create_requires_organizer(self, client, mock_api):
        stub_auth_me(mock_api, user=MEMBER_USER)
        r = client.post(
            "/api/channels",
            json={"slug": "test", "name": "Test"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 403

    def test_create_invalid_slug(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.post(
            "/api/channels",
            json={"slug": "INVALID SLUG!", "name": "Bad"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 422

    def test_create_no_auth(self, client, mock_api):
        r = client.post("/api/channels", json={"slug": "test", "name": "Test"})
        assert r.status_code == 422


class TestListChannels:
    def test_list_success(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW], "total": 1})
        )
        r = client.get("/api/channels")
        assert r.status_code == 200
        data = r.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1
        assert data["offset"] == 0
        assert data["has_more"] is False

    def test_list_filter_visibility(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [], "total": 0})
        )
        r = client.get("/api/channels?visibility=private")
        assert r.status_code == 200
        assert r.json()["items"] == []

    def test_list_pagination_has_more(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW], "total": 100})
        )
        r = client.get("/api/channels?limit=10&skip=0")
        assert r.status_code == 200
        data = r.json()
        assert data["has_more"] is True
        assert data["total"] == 100


class TestGetChannel:
    def test_get_success(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW]})
        )
        r = client.get("/api/channels/general")
        assert r.status_code == 200
        assert r.json()["slug"] == "general"

    def test_get_not_found(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.get("/api/channels/nonexistent")
        assert r.status_code == 404


class TestUpdateChannel:
    def test_update_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW]})
        )
        mock_api.put(f"{_table_prefix()}/rows/row-1").mock(
            return_value=httpx.Response(200, json={**CHANNEL_ROW, "topic": "updated"})
        )
        r = client.patch(
            "/api/channels/general",
            json={"topic": "updated"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_update_no_fields(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW]})
        )
        r = client.patch("/api/channels/general", json={}, headers=AUTH_HEADER)
        assert r.status_code == 400

    def test_update_not_found(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.patch(
            "/api/channels/missing",
            json={"topic": "x"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 404


class TestWsToken:
    def test_mint_token(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW]})
        )
        r = client.post("/api/channels/general/ws-token", headers=AUTH_HEADER)
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["expires_in"] == settings.ws_token_ttl_seconds

    def test_mint_token_channel_not_found(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.post("/api/channels/missing/ws-token", headers=AUTH_HEADER)
        assert r.status_code == 404

    def test_mint_token_no_auth(self, client, mock_api):
        r = client.post("/api/channels/general/ws-token")
        assert r.status_code == 422
