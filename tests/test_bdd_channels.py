"""BDD step definitions for channels.feature."""

import httpx
import pytest
import respx
from pytest_bdd import given, parsers, scenarios, then, when

from app.config import settings
from app.main import app
from fastapi.testclient import TestClient
from tests.conftest import AUTH_HEADER, FAKE_USER, MEMBER_USER

scenarios("features/channels.feature")

TABLE = f"/api/v1/projects/{settings.project_id}/database/tables/channels"


@pytest.fixture()
def ctx():
    return {"response": None, "event_called": False}


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


@given(parsers.parse('a channel with slug "{slug}" already exists'))
def given_channel_exists(bdd_mock, ctx, slug):
    ctx["_duplicate_slug"] = slug


@given("there are public channels in the registry")
def given_public_channels(bdd_mock):
    bdd_mock.post(f"{TABLE}/query").mock(
        return_value=httpx.Response(
            200,
            json={"data": [{"slug": "general", "visibility": "public", "archived": False}], "total": 1},
        )
    )


@given(parsers.parse('a channel with slug "{slug}" exists'))
def given_single_channel(bdd_mock, slug):
    bdd_mock.post(f"{TABLE}/query").mock(
        return_value=httpx.Response(
            200, json={"data": [{"slug": slug, "stream_id": "s-1"}]}
        )
    )


# --- When ---

@when(parsers.parse('I create a channel with slug "{slug}" and name "{name}"'))
def when_create_channel(bdd_client, bdd_mock, ctx, slug, name):
    dup_slug = ctx.get("_duplicate_slug")
    if dup_slug:
        bdd_mock.post(f"{TABLE}/query").mock(
            return_value=httpx.Response(200, json={"data": [{"slug": dup_slug}]})
        )
    else:
        bdd_mock.post(f"{TABLE}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
    bdd_mock.post(f"{TABLE}/rows").mock(
        return_value=httpx.Response(200, json={"slug": slug, "name": name, "id": "ch-new"})
    )
    event_route = bdd_mock.post("/api/v1/public/zerodb/events").mock(
        return_value=httpx.Response(200, json={"ok": True})
    )
    ctx["response"] = bdd_client.post(
        "/api/channels",
        json={"slug": slug, "name": name, "topic": "Test"},
        headers=AUTH_HEADER,
    )
    ctx["event_route"] = event_route


@when("I list channels")
def when_list_channels(bdd_client, ctx):
    ctx["response"] = bdd_client.get("/api/channels")


@when(parsers.parse('I get channel "{slug}"'))
def when_get_channel(bdd_client, ctx, slug):
    ctx["response"] = bdd_client.get(f"/api/channels/{slug}")


# --- Then ---

@then(parsers.parse("the response status is {code:d}"))
def then_status(ctx, code):
    assert ctx["response"].status_code == code


@then(parsers.parse('the channel has slug "{slug}"'))
def then_slug(ctx, slug):
    assert ctx["response"].json().get("slug") == slug


@then(parsers.parse('a "{event_type}" event is emitted'))
def then_event_emitted(ctx, event_type):
    route = ctx.get("event_route")
    if route:
        assert route.called


@then(parsers.parse('the response contains "items" with at least {n:d} entry'))
def then_items(ctx, n):
    assert len(ctx["response"].json().get("items", [])) >= n


@then("archived channels are excluded")
def then_no_archived(ctx):
    for item in ctx["response"].json().get("items", []):
        assert item.get("archived") is not True
