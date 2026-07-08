"""BDD step definitions for announcements.feature."""

import httpx
import pytest
import respx
from pytest_bdd import given, parsers, scenarios, then, when

from app.config import settings
from app.main import app
from fastapi.testclient import TestClient
from tests.conftest import AUTH_HEADER, FAKE_USER, MEMBER_USER

scenarios("features/announcements.feature")

TABLE = f"/api/v1/projects/{settings.project_id}/database/tables/announcements"
ANN_ROW = {
    "id": "ann-1",
    "title": "Welcome!",
    "body": "Hello SC Builders",
    "channel_slug": "general",
    "pinned": False,
    "author_id": "user-001",
}
PINNED_ROW = {**ANN_ROW, "id": "ann-2", "pinned": True}


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


def _stub_organizer(mock):
    mock.get("/v1/auth/me").mock(return_value=httpx.Response(200, json=FAKE_USER))


def _stub_member(mock):
    mock.get("/v1/auth/me").mock(return_value=httpx.Response(200, json=MEMBER_USER))


# --- Given ---

@given("I am logged in as an organizer")
def given_organizer(bdd_mock):
    _stub_organizer(bdd_mock)


@given("I am logged in as a member")
def given_member(bdd_mock):
    _stub_member(bdd_mock)


@given(parsers.parse('an announcement exists in channel "{channel}"'))
def given_announcement_in_channel(bdd_mock, channel):
    bdd_mock.post(f"{TABLE}/query").mock(
        return_value=httpx.Response(
            200, json={"data": [{**ANN_ROW, "channel_slug": channel}], "total": 1}
        )
    )


@given(parsers.parse('an announcement "{ann_id}" exists'))
def given_announcement_exists(bdd_mock, ann_id):
    pass


@given("there are pinned announcements")
def given_pinned(bdd_mock):
    bdd_mock.post(f"{TABLE}/query").mock(
        return_value=httpx.Response(200, json={"data": [PINNED_ROW], "total": 1})
    )


# --- When ---

@when(parsers.parse('I create an announcement with title "{title}" and body "{body}"'))
def when_create(bdd_client, bdd_mock, ctx, title, body):
    bdd_mock.post(f"{TABLE}/rows").mock(
        return_value=httpx.Response(200, json={**ANN_ROW, "title": title, "body": body})
    )
    event_route = bdd_mock.post("/api/v1/public/zerodb/events").mock(
        return_value=httpx.Response(200, json={"ok": True})
    )
    vector_route = bdd_mock.post(
        f"/api/v1/projects/{settings.project_id}/embeddings/embed-and-store"
    ).mock(return_value=httpx.Response(200, json={"ok": True}))
    ctx["response"] = bdd_client.post(
        "/api/announcements",
        json={"title": title, "body": body, "channel_slug": "general"},
        headers=AUTH_HEADER,
    )
    ctx["event_route"] = event_route
    ctx["vector_route"] = vector_route


@when(parsers.parse('I list announcements for channel "{channel}"'))
def when_list(bdd_client, ctx, channel):
    ctx["response"] = bdd_client.get(f"/api/channels/{channel}/announcements")


@when(parsers.parse("I update announcement \"{ann_id}\" with pinned true"))
def when_pin(bdd_client, bdd_mock, ctx, ann_id):
    bdd_mock.put(f"{TABLE}/rows/{ann_id}").mock(
        return_value=httpx.Response(200, json={**ANN_ROW, "id": ann_id, "pinned": True})
    )
    ctx["response"] = bdd_client.patch(
        f"/api/announcements/{ann_id}",
        json={"pinned": True},
        headers=AUTH_HEADER,
    )


@when("I list pinned announcements")
def when_list_pinned(bdd_client, ctx):
    ctx["response"] = bdd_client.get("/api/announcements/pinned")


# --- Then ---

@then(parsers.parse("the response status is {code:d}"))
def then_status(ctx, code):
    assert ctx["response"].status_code == code


@then(parsers.parse('the announcement has title "{title}"'))
def then_title(ctx, title):
    assert ctx["response"].json().get("title") == title


@then(parsers.parse('a "{event_type}" event is emitted'))
def then_event(ctx, event_type):
    route = ctx.get("event_route")
    if route:
        assert route.called


@then("the announcement is vector-embedded for semantic search")
def then_vector(ctx):
    route = ctx.get("vector_route")
    if route:
        assert route.called


@then(parsers.parse('the response contains "items" with at least {n:d} entry'))
def then_items(ctx, n):
    assert len(ctx["response"].json().get("items", [])) >= n


@then("all returned items have pinned true")
def then_all_pinned(ctx):
    for item in ctx["response"].json().get("items", []):
        assert item.get("pinned") is True
