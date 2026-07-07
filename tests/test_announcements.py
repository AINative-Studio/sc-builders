import httpx

from app.config import settings
from tests.conftest import AUTH_HEADER, FAKE_USER, MEMBER_USER, stub_auth_me


def _table_prefix():
    return f"/api/v1/projects/{settings.project_id}/database/tables/announcements"


ANNOUNCEMENT_ROW = {
    "id": "ann-1",
    "title": "Welcome!",
    "body": "Hello SC Builders",
    "channel_slug": "general",
    "pinned": False,
    "author_id": "user-001",
}

PINNED_ROW = {**ANNOUNCEMENT_ROW, "id": "ann-2", "title": "Important", "pinned": True}


class TestCreateAnnouncement:
    def test_create_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/rows").mock(
            return_value=httpx.Response(200, json=ANNOUNCEMENT_ROW)
        )
        mock_api.post("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post(
            "/api/announcements",
            json={"title": "Welcome!", "body": "Hello SC Builders", "channel_slug": "general"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 201
        assert r.json()["title"] == "Welcome!"

    def test_create_requires_organizer(self, client, mock_api):
        stub_auth_me(mock_api, user=MEMBER_USER)
        r = client.post(
            "/api/announcements",
            json={"title": "Nope", "body": "blocked"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 403

    def test_create_missing_title(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.post(
            "/api/announcements",
            json={"body": "no title"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 422

    def test_create_no_auth(self, client, mock_api):
        r = client.post("/api/announcements", json={"title": "X", "body": "Y"})
        assert r.status_code == 422

    def test_create_emits_event(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/rows").mock(
            return_value=httpx.Response(200, json=ANNOUNCEMENT_ROW)
        )
        event_route = mock_api.post("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        client.post(
            "/api/announcements",
            json={"title": "Test", "body": "body"},
            headers=AUTH_HEADER,
        )
        assert event_route.called


class TestListAnnouncements:
    def test_list_by_channel(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [ANNOUNCEMENT_ROW]})
        )
        r = client.get("/api/channels/general/announcements")
        assert r.status_code == 200
        assert len(r.json()["data"]) == 1

    def test_list_empty(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.get("/api/channels/empty/announcements")
        assert r.status_code == 200
        assert r.json()["data"] == []


class TestPinnedAnnouncements:
    def test_list_pinned(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [PINNED_ROW]})
        )
        r = client.get("/api/announcements/pinned")
        assert r.status_code == 200
        assert len(r.json()["data"]) == 1
        assert r.json()["data"][0]["pinned"] is True

    def test_list_pinned_empty(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.get("/api/announcements/pinned")
        assert r.status_code == 200
        assert r.json()["data"] == []

    def test_list_pinned_with_pagination(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.get("/api/announcements/pinned?limit=10&skip=5")
        assert r.status_code == 200


class TestUpdateAnnouncement:
    def test_update_pin(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.patch(f"{_table_prefix()}/rows/ann-1").mock(
            return_value=httpx.Response(200, json={**ANNOUNCEMENT_ROW, "pinned": True})
        )
        r = client.patch(
            "/api/announcements/ann-1",
            json={"pinned": True},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_update_no_fields(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.patch("/api/announcements/ann-1", json={}, headers=AUTH_HEADER)
        assert r.status_code == 400

    def test_update_requires_organizer(self, client, mock_api):
        stub_auth_me(mock_api, user=MEMBER_USER)
        r = client.patch(
            "/api/announcements/ann-1",
            json={"pinned": True},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 403
