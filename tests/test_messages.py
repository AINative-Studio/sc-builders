import httpx

from app.config import settings
from tests.conftest import AUTH_HEADER, FAKE_USER, MEMBER_USER, stub_auth_me


def _table_prefix():
    return f"/api/v1/projects/{settings.project_id}/database/tables/channels"


CHANNEL_ROW = {
    "id": "row-1",
    "slug": "general",
    "stream_id": "stream-abc",
}


class TestGetHistory:
    def test_history_success(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW]})
        )
        mock_api.get("/api/v1/streams/stream-abc/chat/history").mock(
            return_value=httpx.Response(200, json={"messages": [], "has_more": False})
        )
        r = client.get("/api/channels/general/messages", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert "messages" in r.json()

    def test_history_with_before(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW]})
        )
        mock_api.get("/api/v1/streams/stream-abc/chat/history").mock(
            return_value=httpx.Response(200, json={"messages": []})
        )
        r = client.get(
            "/api/channels/general/messages?before=cursor-123&limit=10",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_history_channel_not_found(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.get("/api/channels/missing/messages", headers=AUTH_HEADER)
        assert r.status_code == 404

    def test_history_no_auth(self, client, mock_api):
        r = client.get("/api/channels/general/messages")
        assert r.status_code == 422


class TestAddModerator:
    def test_add_moderator_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW]})
        )
        mock_api.post("/api/v1/streams/stream-abc/moderators").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post(
            "/api/channels/general/messages/moderators",
            json={"user_id": "user-002"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_add_moderator_requires_organizer(self, client, mock_api):
        stub_auth_me(mock_api, user=MEMBER_USER)
        r = client.post(
            "/api/channels/general/messages/moderators",
            json={"user_id": "user-002"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 403

    def test_add_moderator_channel_not_found(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.post(
            "/api/channels/missing/messages/moderators",
            json={"user_id": "u"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 404


class TestRemoveModerator:
    def test_remove_moderator_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [CHANNEL_ROW]})
        )
        mock_api.delete("/api/v1/streams/stream-abc/moderators/user-002").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.delete(
            "/api/channels/general/messages/moderators/user-002",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_remove_moderator_requires_organizer(self, client, mock_api):
        stub_auth_me(mock_api, user=MEMBER_USER)
        r = client.delete(
            "/api/channels/general/messages/moderators/user-002",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 403
