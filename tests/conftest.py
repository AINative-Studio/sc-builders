import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from app.client import close_client, get_client
from app.config import settings
from app.main import app

FAKE_TOKEN = "test-jwt-token-12345"
FAKE_USER = {"id": "user-001", "email": "tester@example.com", "role": "admin"}
MEMBER_USER = {"id": "user-002", "email": "member@example.com", "role": "member"}
AUTH_HEADER = {"Authorization": f"Bearer {FAKE_TOKEN}"}


@pytest.fixture(autouse=True)
async def _reset_client():
    await close_client()
    yield
    await close_client()


@pytest.fixture()
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture()
def mock_api():
    with respx.mock(base_url=settings.ainative_base_url, assert_all_called=False) as m:
        yield m


def stub_auth_me(mock, user=None):
    u = user or FAKE_USER
    mock.get("/v1/auth/me").mock(return_value=httpx.Response(200, json=u))
