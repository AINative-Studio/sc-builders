import json
import time

import httpx
import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app


def _make_ws_token(slug="general", user_id="user-001", expired=False):
    now = int(time.time())
    payload = {
        "jti": "test-jti",
        "sub": user_id,
        "channel_slug": slug,
        "stream_id": "",
        "iat": now,
        "exp": now + (-10 if expired else 900),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


@pytest.fixture()
def client():
    return TestClient(app, raise_server_exceptions=False)


class TestWebSocketConnect:
    def test_connect_no_token(self, client):
        with pytest.raises(Exception):
            with client.websocket_connect("/ws/chat"):
                pass

    def test_connect_expired_token(self, client):
        token = _make_ws_token(expired=True)
        with pytest.raises(Exception):
            with client.websocket_connect(f"/ws/chat?token={token}"):
                pass

    def test_connect_valid_token(self, client, mock_api):
        token = _make_ws_token()
        msg_table = f"/api/v1/projects/{settings.project_id}/database/tables/messages"
        mock_api.post(f"{msg_table}/rows").mock(
            return_value=httpx.Response(200, json={"id": "msg-1"})
        )
        with client.websocket_connect(f"/ws/chat?token={token}") as ws:
            ws.send_text(json.dumps({"content": "hello", "sender_name": "Test"}))
            data = ws.receive_json()
            assert data["type"] == "message"
            assert data["content"] == "hello"
            assert data["channel_slug"] == "general"
            assert data["sender_id"] == "user-001"

    def test_empty_message_ignored(self, client, mock_api):
        token = _make_ws_token()
        with client.websocket_connect(f"/ws/chat?token={token}") as ws:
            ws.send_text(json.dumps({"content": ""}))
            ws.send_text(json.dumps({"content": "  "}))
            # No broadcast should happen for empty messages, so send a real one
            msg_table = f"/api/v1/projects/{settings.project_id}/database/tables/messages"
            mock_api.post(f"{msg_table}/rows").mock(
                return_value=httpx.Response(200, json={"id": "msg-2"})
            )
            ws.send_text(json.dumps({"content": "real"}))
            data = ws.receive_json()
            assert data["content"] == "real"


class TestWsStats:
    def test_stats_endpoint(self, client):
        r = client.get("/ws/stats")
        assert r.status_code == 200
        assert "connections" in r.json()
