import json

import httpx

from tests.conftest import AUTH_HEADER, stub_auth_me


class TestCreateIntent:
    def test_create_intent(self, client, mock_api):
        stub_auth_me(mock_api)
        route = mock_api.post("/api/v1/public/intents").mock(
            return_value=httpx.Response(201, json={"intent_id": "i-1", "status": "matching", "matches": []})
        )
        r = client.post(
            "/api/intents",
            headers=AUTH_HEADER,
            json={"text": "Looking for a Rust/WASM developer", "max_matches": 5},
        )
        assert r.status_code == 201
        assert r.json()["intent_id"] == "i-1"
        sent = json.loads(route.calls.last.request.content)
        assert sent["text"] == "Looking for a Rust/WASM developer"
        assert sent["max_matches"] == 5

    def test_create_intent_requires_text(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.post("/api/intents", headers=AUTH_HEADER, json={"max_matches": 5})
        assert r.status_code == 422

    def test_create_intent_no_auth(self, client):
        r = client.post("/api/intents", json={"text": "x"})
        assert r.status_code == 422


class TestListAndGetIntents:
    def test_list_intents(self, client, mock_api):
        stub_auth_me(mock_api)
        route = mock_api.get("/api/v1/public/intents").mock(
            return_value=httpx.Response(200, json={"items": [], "total": 0})
        )
        r = client.get("/api/intents?limit=10&skip=0", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert route.calls.last.request.url.params["limit"] == "10"

    def test_get_intent(self, client, mock_api):
        stub_auth_me(mock_api)
        mock_api.get("/api/v1/public/intents/i-9").mock(
            return_value=httpx.Response(200, json={"intent_id": "i-9", "matches": []})
        )
        r = client.get("/api/intents/i-9", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["intent_id"] == "i-9"


class TestIntentAction:
    def test_accept_match(self, client, mock_api):
        stub_auth_me(mock_api)
        route = mock_api.post("/api/v1/public/intents/i-1/action/agent-7").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post(
            "/api/intents/i-1/action/agent-7",
            headers=AUTH_HEADER,
            json={"action": "accept", "message": "sounds great"},
        )
        assert r.status_code == 200
        sent = json.loads(route.calls.last.request.content)
        assert sent["action"] == "accept"

    def test_action_requires_action_field(self, client, mock_api):
        stub_auth_me(mock_api)
        r = client.post(
            "/api/intents/i-1/action/agent-7",
            headers=AUTH_HEADER,
            json={"message": "hi"},
        )
        assert r.status_code == 422
