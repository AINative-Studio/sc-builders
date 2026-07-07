import httpx

from app.config import settings
from tests.conftest import AUTH_HEADER, FAKE_USER, MEMBER_USER, stub_auth_me


def _msg_table():
    return f"/api/v1/projects/{settings.project_id}/database/tables/messages"


FAKE_MSG = {
    "id": "msg-1",
    "row_data": {
        "channel_slug": "general",
        "sender_id": "user-001",
        "sender_name": "Tester",
        "content": "hello world",
        "sent_at": "2026-07-07T12:00:00Z",
    },
}


class TestGetHistory:
    def test_history_success(self, client, mock_api):
        mock_api.post(f"{_msg_table()}/query").mock(
            return_value=httpx.Response(200, json={"data": [FAKE_MSG], "total": 1})
        )
        r = client.get("/api/channels/general/messages")
        assert r.status_code == 200
        body = r.json()
        assert body["total"] == 1
        assert len(body["items"]) == 1

    def test_history_empty(self, client, mock_api):
        mock_api.post(f"{_msg_table()}/query").mock(
            return_value=httpx.Response(200, json={"data": [], "total": 0})
        )
        r = client.get("/api/channels/general/messages")
        assert r.status_code == 200
        assert r.json()["items"] == []

    def test_history_pagination(self, client, mock_api):
        mock_api.post(f"{_msg_table()}/query").mock(
            return_value=httpx.Response(200, json={"data": [], "total": 0})
        )
        r = client.get("/api/channels/general/messages?limit=10&skip=5")
        assert r.status_code == 200


class TestSendMessage:
    def test_send_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_msg_table()}/rows").mock(
            return_value=httpx.Response(200, json={"id": "msg-new"})
        )
        mock_api.post("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post(
            "/api/channels/general/messages",
            json={"content": "hello"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 201

    def test_send_empty_content(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.post(
            "/api/channels/general/messages",
            json={"content": ""},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 422

    def test_send_no_auth(self, client, mock_api):
        r = client.post(
            "/api/channels/general/messages",
            json={"content": "hello"},
        )
        assert r.status_code == 422


class TestDeleteMessage:
    def test_delete_own_message(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_msg_table()}/query").mock(
            return_value=httpx.Response(200, json={
                "data": [{"row_data": {"sender_id": "user-001"}}]
            })
        )
        mock_api.delete(f"{_msg_table()}/rows/msg-1").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.delete(
            "/api/channels/general/messages/msg-1",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_delete_others_message_as_member(self, client, mock_api):
        stub_auth_me(mock_api, user=MEMBER_USER)
        mock_api.post(f"{_msg_table()}/query").mock(
            return_value=httpx.Response(200, json={
                "data": [{"row_data": {"sender_id": "user-001"}}]
            })
        )
        r = client.delete(
            "/api/channels/general/messages/msg-1",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 403

    def test_delete_not_found(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_msg_table()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.delete(
            "/api/channels/general/messages/msg-1",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 404
