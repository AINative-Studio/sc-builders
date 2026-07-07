import httpx

from tests.conftest import AUTH_HEADER, FAKE_USER, stub_auth_me


class TestFollow:
    def test_follow_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post("/api/v1/social/follow/user-002").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post("/api/social/follow/user-002", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_unfollow_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.delete("/api/v1/social/follow/user-002").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.delete("/api/social/follow/user-002", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_follow_no_auth(self, client, mock_api):
        r = client.post("/api/social/follow/user-002")
        assert r.status_code == 422


class TestFriendRequest:
    def test_send_friend_request(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post("/api/v1/social/friend-request/user-002").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post("/api/social/friend-request/user-002", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_accept_friend_request(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post("/api/v1/social/req-1/accept").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post("/api/social/friend-request/req-1/accept", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_decline_friend_request(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post("/api/v1/social/req-1/decline").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post("/api/social/friend-request/req-1/decline", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_cancel_friend_request(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.delete("/api/v1/social/friend-request/req-1").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.delete("/api/social/friend-request/req-1", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestBlock:
    def test_block_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post("/api/v1/social/block/user-002").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post("/api/social/block/user-002", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestIgnore:
    def test_ignore_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post("/api/v1/social/ignore/user-002").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post("/api/social/ignore/user-002", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestSocialReads:
    def test_followers(self, client, mock_api):
        mock_api.get("/api/v1/social/user-002/followers").mock(
            return_value=httpx.Response(200, json={"users": []})
        )
        r = client.get("/api/social/user-002/followers", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_following(self, client, mock_api):
        mock_api.get("/api/v1/social/user-002/following").mock(
            return_value=httpx.Response(200, json={"users": []})
        )
        r = client.get("/api/social/user-002/following", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_friends(self, client, mock_api):
        mock_api.get("/api/v1/social/user-002/friends").mock(
            return_value=httpx.Response(200, json={"users": []})
        )
        r = client.get("/api/social/user-002/friends", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_my_friend_requests(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/social/me/friend-requests").mock(
            return_value=httpx.Response(200, json={"requests": []})
        )
        r = client.get("/api/social/me/friend-requests", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_my_stats(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/social/me/stats").mock(
            return_value=httpx.Response(200, json={"followers": 0, "following": 0})
        )
        r = client.get("/api/social/me/stats", headers=AUTH_HEADER)
        assert r.status_code == 200
