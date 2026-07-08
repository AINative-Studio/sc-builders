"""
CI integration smoke tests using AINative instant-db.

These tests spin up a 72-hour ephemeral project via the instant-db API,
run happy-path tests against real ZeroDB endpoints, then tear down.

Run: pytest tests/test_integration_smoke.py -v --timeout=60
Skip: pytest tests/test_integration_smoke.py -v -m "not integration"

Requires: AINATIVE_USERNAME + AINATIVE_PASSWORD in .env (or env vars)
"""

import os
import uuid

import httpx
import pytest

BASE_URL = os.getenv("AINATIVE_BASE_URL", "https://api.ainative.studio")

SKIP_REASON = "Set RUN_INTEGRATION=1 to run integration smoke tests"
pytestmark = pytest.mark.skipif(
    os.getenv("RUN_INTEGRATION", "") != "1", reason=SKIP_REASON
)


@pytest.fixture(scope="module")
def auth_token():
    email = os.getenv("AINATIVE_USERNAME", "admin@ainative.studio")
    password = os.getenv("AINATIVE_PASSWORD", "")
    if not password:
        pytest.skip("AINATIVE_PASSWORD not set")
    with httpx.Client(base_url=BASE_URL, timeout=15) as c:
        r = c.post("/v1/auth/login", json={"email": email, "password": password})
        assert r.status_code == 200, f"Login failed: {r.text}"
        return r.json()["access_token"]


@pytest.fixture(scope="module")
def instant_project(auth_token):
    """Provision a 72-hour instant-db project for integration tests."""
    with httpx.Client(base_url=BASE_URL, timeout=30) as c:
        headers = {"Authorization": f"Bearer {auth_token}"}
        r = c.post("/api/v1/public/instant-db", headers=headers)
        if r.status_code not in (200, 201):
            pytest.skip(f"instant-db not available: {r.status_code} {r.text[:200]}")
        data = r.json()
        project_id = data.get("project_id") or data.get("id", "")
        api_key = data.get("api_key") or data.get("key", "")
        assert project_id, "No project_id in instant-db response"
        yield {"project_id": project_id, "api_key": api_key}


@pytest.fixture(scope="module")
def db_client(instant_project):
    headers = {"X-API-Key": instant_project["api_key"]}
    with httpx.Client(base_url=BASE_URL, headers=headers, timeout=15) as c:
        yield c, instant_project["project_id"]


class TestTableCRUD:
    """Smoke test: create table, insert, query, update, delete."""

    TABLE_NAME = f"smoke_test_{uuid.uuid4().hex[:8]}"

    def test_01_create_table(self, db_client):
        c, pid = db_client
        r = c.post(
            f"/api/v1/projects/{pid}/database/tables",
            json={"table_name": self.TABLE_NAME},
        )
        assert r.status_code in (200, 201, 409), f"Create table: {r.text}"

    def test_02_insert_row(self, db_client):
        c, pid = db_client
        r = c.post(
            f"/api/v1/projects/{pid}/database/tables/{self.TABLE_NAME}/rows",
            json={"row_data": {"slug": "general", "name": "General", "active": True}},
        )
        assert r.status_code in (200, 201), f"Insert: {r.text}"
        self.__class__.row_id = r.json().get("id") or r.json().get("_id", "")

    def test_03_query_rows(self, db_client):
        c, pid = db_client
        r = c.post(
            f"/api/v1/projects/{pid}/database/tables/{self.TABLE_NAME}/query",
            json={"filters": {"slug": {"$eq": "general"}}, "limit": 10},
        )
        assert r.status_code == 200
        data = r.json().get("data", [])
        assert len(data) >= 1
        assert data[0]["slug"] == "general"

    def test_04_update_row(self, db_client):
        c, pid = db_client
        row_id = getattr(self.__class__, "row_id", None)
        if not row_id:
            pytest.skip("No row_id from insert")
        r = c.patch(
            f"/api/v1/projects/{pid}/database/tables/{self.TABLE_NAME}/rows/{row_id}",
            json={"name": "General Chat"},
        )
        assert r.status_code == 200

    def test_05_delete_row(self, db_client):
        c, pid = db_client
        row_id = getattr(self.__class__, "row_id", None)
        if not row_id:
            pytest.skip("No row_id from insert")
        r = c.delete(
            f"/api/v1/projects/{pid}/database/tables/{self.TABLE_NAME}/rows/{row_id}"
        )
        assert r.status_code in (200, 204)


class TestEventEmission:
    """Smoke test: emit and read ZeroDB events."""

    def test_emit_and_read(self, db_client):
        c, _ = db_client
        event_type = f"smoke.test.{uuid.uuid4().hex[:6]}"

        r = c.post(
            "/api/v1/public/zerodb/events",
            json={"type": event_type, "data": {"msg": "hello"}, "source": "ci-smoke"},
        )
        assert r.status_code in (200, 201), f"Emit: {r.text}"

        r2 = c.get("/api/v1/public/zerodb/events", params={"type": event_type, "limit": 5})
        assert r2.status_code == 200
        events = r2.json() if isinstance(r2.json(), list) else r2.json().get("events", [])
        assert len(events) >= 1


class TestEmbeddingSearch:
    """Smoke test: embed-and-store + semantic search."""

    def test_embed_and_search(self, db_client):
        c, pid = db_client

        r = c.post(
            f"/api/v1/projects/{pid}/embeddings/embed-and-store",
            json={
                "text": "Santa Cruz builders meetup about Rust and WebAssembly",
                "collection": "smoke_test",
                "model": "bge-m3",
            },
        )
        if r.status_code == 404:
            pytest.skip("Embeddings API not available")
        assert r.status_code in (200, 201), f"Embed: {r.text}"

        r2 = c.post(
            f"/api/v1/projects/{pid}/embeddings/search",
            json={"query": "Rust meetup", "collection": "smoke_test", "limit": 5},
        )
        assert r2.status_code == 200
        results = r2.json().get("results", [])
        assert len(results) >= 1


class TestAuthFlow:
    """Smoke test: login + me endpoint."""

    def test_login_and_me(self, auth_token):
        with httpx.Client(base_url=BASE_URL, timeout=15) as c:
            headers = {"Authorization": f"Bearer {auth_token}"}
            r = c.get("/v1/auth/me", headers=headers)
            assert r.status_code == 200
            assert "email" in r.json()
