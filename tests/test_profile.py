import json

import httpx

from tests.conftest import AUTH_HEADER, stub_auth_me


class TestGetMyProfile:
    def test_get_me(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/public/profile/me").mock(
            return_value=httpx.Response(200, json={"id": "u-1", "bio": "hi", "followers_count": 3})
        )
        r = client.get("/api/profile/me", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["bio"] == "hi"

    def test_get_me_no_auth(self, client):
        r = client.get("/api/profile/me")
        assert r.status_code == 422


class TestUpdateMyProfile:
    def test_patch_me(self, client, mock_api):
        stub_auth_me(mock_api)
        route = mock_api.patch("/api/v1/public/profile/me").mock(
            return_value=httpx.Response(200, json={"id": "u-1", "bio": "updated", "location": "Santa Cruz"})
        )
        r = client.patch(
            "/api/profile/me",
            headers=AUTH_HEADER,
            json={"bio": "updated", "location": "Santa Cruz"},
        )
        assert r.status_code == 200
        sent = json.loads(route.calls.last.request.content)
        assert sent["bio"] == "updated"
        assert sent["location"] == "Santa Cruz"
        # exclude_none: unset fields shouldn't be forwarded.
        assert "website" not in sent

    def test_patch_me_no_auth(self, client):
        r = client.patch("/api/profile/me", json={"bio": "x"})
        assert r.status_code == 422


class TestGetProfileById:
    def test_get_other(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/public/profile/u-2").mock(
            return_value=httpx.Response(200, json={"id": "u-2", "full_name": "Someone"})
        )
        r = client.get("/api/profile/u-2", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["full_name"] == "Someone"
