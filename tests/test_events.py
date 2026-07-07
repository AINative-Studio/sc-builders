import httpx

from tests.conftest import AUTH_HEADER, FAKE_USER, MEMBER_USER, stub_auth_me

FAKE_EVENT = {"id": "evt-1", "title": "SC Meetup", "starts_at": "2026-08-01T18:00:00Z"}


class TestCreateEvent:
    def test_create_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post("/api/v1/community-events").mock(
            return_value=httpx.Response(201, json=FAKE_EVENT)
        )
        r = client.post(
            "/api/events",
            json={"title": "SC Meetup", "starts_at": "2026-08-01T18:00:00Z"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 201
        assert r.json()["title"] == "SC Meetup"

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
        mock_api.get("/api/v1/community-events").mock(
            return_value=httpx.Response(200, json={"items": [FAKE_EVENT]})
        )
        r = client.get("/api/events", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_list_with_pagination(self, client, mock_api):
        mock_api.get("/api/v1/community-events").mock(
            return_value=httpx.Response(200, json={"items": []})
        )
        r = client.get("/api/events?limit=10&offset=5", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestGetEvent:
    def test_get_success(self, client, mock_api):
        mock_api.get("/api/v1/community-events/evt-1").mock(
            return_value=httpx.Response(200, json=FAKE_EVENT)
        )
        r = client.get("/api/events/evt-1", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_get_not_found(self, client, mock_api):
        mock_api.get("/api/v1/community-events/bad").mock(
            return_value=httpx.Response(404, json={"detail": "not found"})
        )
        r = client.get("/api/events/bad", headers=AUTH_HEADER)
        assert r.status_code == 404


class TestUpdateEvent:
    def test_update_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.patch("/api/v1/community-events/evt-1").mock(
            return_value=httpx.Response(200, json={**FAKE_EVENT, "title": "Updated"})
        )
        r = client.patch(
            "/api/events/evt-1",
            json={"title": "Updated"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200


class TestDeleteEvent:
    def test_delete_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.delete("/api/v1/community-events/evt-1").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.delete("/api/events/evt-1", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestRSVP:
    def test_rsvp_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post("/api/v1/community-events/evt-1/rsvp").mock(
            return_value=httpx.Response(200, json={"status": "going"})
        )
        r = client.post(
            "/api/events/evt-1/rsvp",
            json={"status": "going"},
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
        mock_api.get("/api/v1/community-events/evt-1/attendees").mock(
            return_value=httpx.Response(200, json={"attendees": []})
        )
        r = client.get("/api/events/evt-1/attendees", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestBrowseEvents:
    def test_browse(self, client, mock_api):
        mock_api.get("/api/v1/community-events/browse").mock(
            return_value=httpx.Response(200, json={"items": []})
        )
        r = client.get("/api/events/browse", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestMyEvents:
    def test_my_events(self, client, mock_api):
        mock_api.get("/api/v1/community-events/my-events").mock(
            return_value=httpx.Response(200, json={"items": []})
        )
        r = client.get("/api/events/mine", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestIcal:
    def test_export_ical(self, client, mock_api):
        mock_api.get("/api/v1/community-events/evt-1/export/ical").mock(
            return_value=httpx.Response(200, json={"ical": "BEGIN:VCALENDAR..."})
        )
        r = client.get("/api/events/evt-1/ical", headers=AUTH_HEADER)
        assert r.status_code == 200
