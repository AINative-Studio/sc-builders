import httpx

from app.config import settings
from tests.conftest import AUTH_HEADER, FAKE_USER, stub_auth_me


def _table_prefix():
    return f"/api/v1/projects/{settings.project_id}/database/tables/member_directory"


MEMBER_ROW = {
    "id": "mem-1",
    "user_id": "user-001",
    "display_name": "Tester",
    "skills": ["python", "react"],
    "github": "tester",
    "availability": "open_to_collab",
}


class TestListMembers:
    def test_list_success(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [MEMBER_ROW], "total": 1})
        )
        r = client.get("/api/members")
        assert r.status_code == 200
        assert len(r.json()["items"]) == 1
        assert r.json()["total"] == 1

    def test_list_filter_skill(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [MEMBER_ROW], "total": 1})
        )
        r = client.get("/api/members?skill=python")
        assert r.status_code == 200

    def test_list_filter_availability(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [], "total": 0})
        )
        r = client.get("/api/members?availability=hiring")
        assert r.status_code == 200

    def test_list_pagination(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [], "total": 0})
        )
        r = client.get("/api/members?limit=10&skip=5")
        assert r.status_code == 200


class TestGetMyProfile:
    def test_get_existing_profile(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [MEMBER_ROW]})
        )
        r = client.get("/api/members/me", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["display_name"] == "Tester"

    def test_get_empty_profile(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.get("/api/members/me", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["user_id"] == "user-001"

    def test_get_no_auth(self, client, mock_api):
        r = client.get("/api/members/me")
        assert r.status_code == 422


class TestGetMember:
    def test_get_success(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [MEMBER_ROW]})
        )
        r = client.get("/api/members/user-001")
        assert r.status_code == 200
        assert r.json()["user_id"] == "user-001"

    def test_get_not_found(self, client, mock_api):
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        r = client.get("/api/members/nonexistent")
        assert r.status_code == 404


class TestUpdateMyProfile:
    def test_update_existing(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [MEMBER_ROW]})
        )
        mock_api.put(f"{_table_prefix()}/rows/mem-1").mock(
            return_value=httpx.Response(200, json={**MEMBER_ROW, "display_name": "Updated"})
        )
        r = client.patch(
            "/api/members/me",
            json={"display_name": "Updated"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_update_row_keyed_by_row_id(self, client, mock_api):
        # Real ZeroDB rows expose the id as `row_id`, not `id`. The update must
        # resolve that, otherwise it PATCHes .../rows/None and 500s (prod bug).
        stub_auth_me(mock_api)
        row = {"row_id": "row-9", "user_id": "user-001", "display_name": "Tester"}
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [row]})
        )
        route = mock_api.put(f"{_table_prefix()}/rows/row-9").mock(
            return_value=httpx.Response(200, json={**row, "display_name": "New"})
        )
        r = client.patch("/api/members/me", json={"display_name": "New"}, headers=AUTH_HEADER)
        assert r.status_code == 200
        assert route.called

    def test_create_profile_on_first_update(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        mock_api.post(f"{_table_prefix()}/rows").mock(
            return_value=httpx.Response(200, json={**MEMBER_ROW, "display_name": "New"})
        )
        r = client.patch(
            "/api/members/me",
            json={"display_name": "New", "skills": ["go"]},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 200

    def test_update_no_fields(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.patch("/api/members/me", json={}, headers=AUTH_HEADER)
        assert r.status_code == 400

    def test_update_invalid_availability(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.patch(
            "/api/members/me",
            json={"availability": "invalid_value"},
            headers=AUTH_HEADER,
        )
        assert r.status_code == 422

    def test_update_no_auth(self, client, mock_api):
        r = client.patch("/api/members/me", json={"display_name": "Test"})
        assert r.status_code == 422
