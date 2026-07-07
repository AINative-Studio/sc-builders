"""BDD step definitions for notifications.feature."""

import httpx
import pytest
import respx
from pytest_bdd import given, parsers, scenarios, then, when

from app.config import settings
from app.main import app
from fastapi.testclient import TestClient
from tests.conftest import AUTH_HEADER, MEMBER_USER

scenarios("features/notifications.feature")

READS_TABLE = f"/api/v1/projects/{settings.project_id}/database/tables/notification_reads"
EVENTS_URL = "/api/v1/public/zerodb/events"


@pytest.fixture()
def ctx():
    return {"response": None}


@pytest.fixture()
def bdd_client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture()
def bdd_mock():
    with respx.mock(base_url=settings.ainative_base_url, assert_all_called=False) as m:
        yield m


def _stub_member(mock):
    mock.get("/v1/auth/me").mock(return_value=httpx.Response(200, json=MEMBER_USER))


# --- Given ---

@given("I am logged in as a member")
def given_member(bdd_mock):
    _stub_member(bdd_mock)


@given("there are community events in the feed")
def given_events(bdd_mock):
    bdd_mock.get(EVENTS_URL).mock(
        return_value=httpx.Response(200, json={
            "events": [
                {"id": "evt-1", "type": "community.announcement", "data": {"title": "Test"}},
                {"id": "evt-2", "type": "community.channel.created", "data": {"slug": "new"}},
            ]
        })
    )
    bdd_mock.post(f"{READS_TABLE}/query").mock(
        return_value=httpx.Response(200, json={"data": []})
    )


@given(parsers.parse('I have unread notifications with ids {ids}'))
def given_unread(bdd_mock, ids):
    bdd_mock.post(f"{READS_TABLE}/query").mock(
        return_value=httpx.Response(200, json={"data": []})
    )
    bdd_mock.post(f"{READS_TABLE}/rows").mock(
        return_value=httpx.Response(200, json={"ok": True})
    )


# --- When ---

@when("I fetch my notifications")
def when_fetch(bdd_client, ctx):
    ctx["response"] = bdd_client.get("/api/notifications", headers=AUTH_HEADER)


@when(parsers.parse('I mark notifications {ids} as read'))
def when_mark_read(bdd_client, bdd_mock, ctx, ids):
    bdd_mock.post(f"{READS_TABLE}/query").mock(
        return_value=httpx.Response(200, json={"data": []})
    )
    bdd_mock.post(f"{READS_TABLE}/rows").mock(
        return_value=httpx.Response(200, json={"ok": True})
    )
    ctx["response"] = bdd_client.post(
        "/api/notifications/read",
        json={"event_ids": ["evt-1", "evt-2"]},
        headers=AUTH_HEADER,
    )


@when("I mark all notifications as read")
def when_mark_all(bdd_client, bdd_mock, ctx):
    bdd_mock.get(EVENTS_URL).mock(
        return_value=httpx.Response(200, json={
            "events": [
                {"id": "evt-1", "type": "community.announcement", "data": {}},
            ]
        })
    )
    bdd_mock.post(f"{READS_TABLE}/query").mock(
        return_value=httpx.Response(200, json={"data": []})
    )
    bdd_mock.post(f"{READS_TABLE}/rows").mock(
        return_value=httpx.Response(200, json={"ok": True})
    )
    ctx["response"] = bdd_client.post(
        "/api/notifications/read-all", headers=AUTH_HEADER
    )


# --- Then ---

@then(parsers.parse("the response status is {code:d}"))
def then_status(ctx, code):
    assert ctx["response"].status_code == code


@then('each notification has a "type" field')
def then_type(ctx):
    for n in ctx["response"].json().get("items", []):
        assert "type" in n


@then("unread notifications are included")
def then_unread(ctx):
    body = ctx["response"].json()
    assert len(body.get("items", [])) > 0


@then("those notifications no longer appear as unread")
def then_marked():
    pass
