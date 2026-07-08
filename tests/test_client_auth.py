"""Regression: X-API-Key must not override a user Bearer token.

The platform prioritizes X-API-Key over Bearer, so sending both makes every
authenticated request resolve to the admin identity. The client must send the
API key ONLY for service calls (no bearer).
"""

import httpx
import pytest

from app import client as client_module


@pytest.mark.asyncio
async def test_bearer_call_omits_api_key(monkeypatch):
    captured = {}

    async def fake_request(self, method, path, **kwargs):
        captured["headers"] = kwargs.get("headers", {})
        return httpx.Response(200, json={})

    monkeypatch.setattr(httpx.AsyncClient, "request", fake_request)
    await client_module.api_request("GET", "/v1/auth/me", bearer_token="user-token")

    assert captured["headers"].get("Authorization") == "Bearer user-token"
    assert "X-API-Key" not in captured["headers"], "API key must not accompany a user token"


@pytest.mark.asyncio
async def test_service_call_uses_api_key(monkeypatch):
    captured = {}

    async def fake_request(self, method, path, **kwargs):
        captured["headers"] = kwargs.get("headers", {})
        return httpx.Response(200, json={})

    monkeypatch.setattr(httpx.AsyncClient, "request", fake_request)
    await client_module.api_request("POST", "/v1/auth/login", json={})

    assert "X-API-Key" in captured["headers"], "service calls should send the API key"
    assert "Authorization" not in captured["headers"]
