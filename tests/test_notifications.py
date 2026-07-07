import httpx

from app.config import settings
from tests.conftest import AUTH_HEADER, stub_auth_me


def _table_query(table: str):
    return f"/api/v1/projects/{settings.project_id}/database/tables/{table}/query"


def _reads_prefix():
    return f"/api/v1/projects/{settings.project_id}/database/tables/notification_reads"


def _stub_community_tables(mock, rows=None):
    """Mock the three community tables that notifications.py queries."""
    if rows is None:
        rows = {
            "events": [],
            "announcements": [
                {"row_data": {"title": "Announcement"}, "row_id": "e1", "created_at": "2026-01-01T00:00:00Z"},
            ],
            "event_rsvps": [],
        }
    for table in ("events", "announcements", "event_rsvps"):
        mock.post(_table_query(table)).mock(
            return_value=httpx.Response(200, json={"data": rows.get(table, [])})
        )


class TestGetNotifications:
    def test_list_success(self, client, mock_api):
        stub_auth_me(mock_api)
        _stub_community_tables(mock_api)
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
        _stub_community_tables(mock_api, rows={
            "events": [
                {"row_data": {"title": "Event"}, "row_id": "e1", "created_at": "2026-01-02T00:00:00Z"},
            ],
            "announcements": [
                {"row_data": {"title": "Ann"}, "row_id": "e2", "created_at": "2026-01-01T00:00:00Z"},
            ],
            "event_rsvps": [],
        })
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
        _stub_community_tables(mock_api, rows={
            "events": [], "announcements": [], "event_rsvps": [],
        })
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
        _stub_community_tables(mock_api, rows={
            "events": [
                {"row_data": {"title": "Ev1"}, "row_id": "e1", "created_at": "2026-01-02T00:00:00Z"},
            ],
            "announcements": [
                {"row_data": {"title": "Ann1"}, "row_id": "e2", "created_at": "2026-01-01T00:00:00Z"},
            ],
            "event_rsvps": [],
        })
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
