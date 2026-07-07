import httpx

from tests.conftest import AUTH_HEADER, stub_auth_me


class TestGetNotifications:
    def test_list_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"events": []})
        )
        r = client.get("/api/notifications", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_list_with_type_filter(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"events": []})
        )
        r = client.get(
            "/api/notifications?event_type=community.announcement&limit=10",
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_list_no_auth(self, client, mock_api):
        r = client.get("/api/notifications")
        assert r.status_code == 422

    def test_list_default_limit(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/public/zerodb/events").mock(
            return_value=httpx.Response(200, json={"events": []})
        )
        r = client.get("/api/notifications", headers=AUTH_HEADER)
        assert r.status_code == 200
