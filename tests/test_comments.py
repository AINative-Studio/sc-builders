import httpx

from tests.conftest import AUTH_HEADER, FAKE_USER, stub_auth_me


FAKE_COMMENT = {"id": "cmt-1", "content": "Great meetup!", "content_type": "event", "content_id": "evt-1"}


class TestCreateComment:
    def test_create_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post("/api/v1/community/comments").mock(
            return_value=httpx.Response(201, json=FAKE_COMMENT)
        )
        r = client.post(
            "/api/comments",
            json={"content": "Great meetup!", "content_type": "event", "content_id": "evt-1"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 201
        assert r.json()["content"] == "Great meetup!"

    def test_create_no_auth(self, client, mock_api):
        r = client.post(
            "/api/comments",
            json={"content": "test", "content_type": "event", "content_id": "1"},
        )
        assert r.status_code == 422

    def test_create_invalid_type(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.post(
            "/api/comments",
            json={"content": "test", "content_type": "invalid", "content_id": "1"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 422

    def test_create_empty_content(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.post(
            "/api/comments",
            json={"content": "", "content_type": "event", "content_id": "1"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 422


class TestListComments:
    def test_list_success(self, client, mock_api):
        mock_api.get("/api/v1/community/comments/event/evt-1").mock(
            return_value=httpx.Response(200, json={"comments": [FAKE_COMMENT]})
        )
        r = client.get("/api/comments/event/evt-1", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_list_with_pagination(self, client, mock_api):
        mock_api.get("/api/v1/community/comments/channel/ch-1").mock(
            return_value=httpx.Response(200, json={"comments": []})
        )
        r = client.get("/api/comments/channel/ch-1?limit=10&offset=5", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestDeleteComment:
    def test_delete_success(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.delete("/api/v1/community/comments/cmt-1").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.delete("/api/comments/cmt-1", headers=AUTH_HEADER)
        assert r.status_code == 200

    def test_delete_not_found(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.delete("/api/v1/community/comments/bad").mock(
            return_value=httpx.Response(404, json={"detail": "not found"})
        )
        r = client.delete("/api/comments/bad", headers=AUTH_HEADER)
        assert r.status_code == 404

    def test_delete_no_auth(self, client, mock_api):
        r = client.delete("/api/comments/cmt-1")
        assert r.status_code == 422
