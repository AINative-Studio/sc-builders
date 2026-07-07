import httpx

from app.config import settings
from tests.conftest import AUTH_HEADER, stub_auth_me


def _reads_prefix():
    return f"/api/v1/projects/{settings.project_id}/database/tables/notification_reads"


class TestGetNotifications:
    def test_list_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"events": [{"id": "e1", "type": "community.announcement"}]})
        )
        mock_api.post(f"{_reads_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.get("/api/notifications", headers=AUTH_HEADER)
        assert r.status_code == 200
        data = r.json()
        assert data["unread_count"] == 1
        assert data["items"][0]["is_read"] is False

    def test_list_with_read_events(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"events": [{"id": "e1"}, {"id": "e2"}]})
        )
        mock_api.post(f"{_reads_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [{"event_id": "e1"}]})
        )
        r = client.get("/api/notifications", headers=AUTH_HEADER)
        assert r.status_code == 200
        data = r.json()
        assert data["unread_count"] == 1
        assert data["items"][0]["is_read"] is True
        assert data["items"][1]["is_read"] is False

    def test_list_with_type_filter(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"events": []})
        )
        mock_api.post(f"{_reads_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.get(
            "/api/notifications?event_type=community.announcement&limit=10",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200
        assert r.json()["unread_count"] == 0

    def test_list_no_auth(self, client, mock_api):
        r = client.get("/api/notifications")
        assert r.status_code == 422


class TestMarkRead:
    def test_mark_single_read(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_reads_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        mock_api.post(f"{_reads_prefix()}/rows").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post(
            "/api/notifications/read",
            json={"event_ids": ["e1"]},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200
        assert r.json()["marked"] == 1

    def test_mark_already_read_skips(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_reads_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [{"event_id": "e1"}]})
        )
        r = client.post(
            "/api/notifications/read",
            json={"event_ids": ["e1"]},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200
        assert r.json()["marked"] == 0

    def test_mark_no_auth(self, client, mock_api):
        r = client.post("/api/notifications/read", json={"event_ids": ["e1"]})
        assert r.status_code == 422


class TestMarkAllRead:
    def test_mark_all_read(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"events": [{"id": "e1"}, {"id": "e2"}]})
        )
        mock_api.post(f"{_reads_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        mock_api.post(f"{_reads_prefix()}/rows").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post("/api/notifications/read-all", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["marked"] == 2

    def test_mark_all_read_no_auth(self, client, mock_api):
        r = client.post("/api/notifications/read-all")
        assert r.status_code == 422
