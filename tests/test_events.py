import httpx

from app.config import settings
from tests.conftest import AUTH_HEADER, FAKE_USER, MEMBER_USER, stub_auth_me


def _evt_table():
    return f"/api/v1/projects/{settings.project_id}/database/tables/events"


def _rsvp_table():
    return f"/api/v1/projects/{settings.project_id}/database/tables/event_rsvps"


FAKE_EVENT = {
    "id": "evt-1",
    "row_data": {
        "title": "SC Meetup",
        "starts_at": "2026-08-01T18:00:00Z",
        "status": "upcoming",
    },
}


class TestCreateEvent:
    def test_create_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_evt_table()}/rows").mock(
            return_value=httpx.Response(200, json={"id": "evt-new"})
        )
        mock_api.post("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post(
            "/api/events",
            json={"title": "SC Meetup", "starts_at": "2026-08-01T18:00:00Z"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 201

    def test_create_requires_organizer(self, client, mock_api):
        stub_auth_me(mock_api, user=MEMBER_USER)
        r = client.post(
            "/api/events",
            json={"title": "X", "starts_at": "2026-08-01T18:00:00Z"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 403

    def test_create_validation_error(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.post("/api/events", json={}, headers=AUTH_HEADER)
        assert r.status_code == 422


class TestListEvents:
    def test_list_success(self, client, mock_api):
        mock_api.post(f"{_evt_table()}/query").mock(
            return_value=httpx.Response(200, json={"data": [FAKE_EVENT], "total": 1})
        )
        r = client.get("/api/events")
        assert r.status_code == 200
        assert r.json()["total"] == 1

    def test_list_empty(self, client, mock_api):
        mock_api.post(f"{_evt_table()}/query").mock(
            return_value=httpx.Response(200, json={"data": [], "total": 0})
        )
        r = client.get("/api/events")
        assert r.status_code == 200
        assert r.json()["items"] == []


class TestGetEvent:
    def test_get_success(self, client, mock_api):
        mock_api.post(f"{_evt_table()}/query").mock(
            return_value=httpx.Response(200, json={"data": [FAKE_EVENT]})
        )
        r = client.get("/api/events/evt-1")
        assert r.status_code == 200

    def test_get_not_found(self, client, mock_api):
        mock_api.post(f"{_evt_table()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.get("/api/events/bad")
        assert r.status_code == 404


class TestUpdateEvent:
    def test_update_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.patch(f"{_evt_table()}/rows/evt-1").mock(
            return_value=httpx.Response(200, json={"id": "evt-1"})
        )
        r = client.patch(
            "/api/events/evt-1",
            json={"title": "Updated"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_update_no_fields(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.patch(
            "/api/events/evt-1",
            json={},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 400


class TestDeleteEvent:
    def test_delete_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.delete(f"{_evt_table()}/rows/evt-1").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.delete("/api/events/evt-1", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_delete_requires_organizer(self, client, mock_api):
        stub_auth_me(mock_api, user=MEMBER_USER)
        r = client.delete("/api/events/evt-1", headers=AUTH_HEADER)
        assert r.status_code == 403


class TestRSVP:
    def test_rsvp_new(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_rsvp_table()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        mock_api.post(f"{_rsvp_table()}/rows").mock(
            return_value=httpx.Response(200, json={"id": "rsvp-1"})
        )
        r = client.post(
            "/api/events/evt-1/rsvp",
            json={"status": "going"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_rsvp_update_existing(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_rsvp_table()}/query").mock(
            return_value=httpx.Response(200, json={
                "data": [{"id": "rsvp-1", "row_data": {"status": "going"}}]
            })
        )
        mock_api.patch(f"{_rsvp_table()}/rows/rsvp-1").mock(
            return_value=httpx.Response(200, json={"id": "rsvp-1"})
        )
        r = client.post(
            "/api/events/evt-1/rsvp",
            json={"status": "maybe"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_rsvp_invalid_status(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.post(
            "/api/events/evt-1/rsvp",
            json={"status": "invalid"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 422


class TestAttendees:
    def test_get_attendees(self, client, mock_api):
        mock_api.post(f"{_rsvp_table()}/query").mock(
            return_value=httpx.Response(200, json={"data": [], "total": 0})
        )
        r = client.get("/api/events/evt-1/attendees")
        assert r.status_code == 200
        assert r.json()["items"] == []
