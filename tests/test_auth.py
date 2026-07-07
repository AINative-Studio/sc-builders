import httpx
import respx

from tests.conftest import AUTH_HEADER, FAKE_TOKEN, FAKE_USER, stub_auth_me


class TestRegister:
    def test_register_success(self, client, mock_api):
        mock_api.post("/v1/auth/register").mock(
            return_value=httpx.Response(200, json={"id": "new-user", "email": "new@example.com"})
        )
        r = client.post("/api/auth/register", json={"email": "new@example.com", "password": "Secret1!"})
        assert r.status_code == 200
        assert r.json()["email"] == "new@example.com"

    def test_register_upstream_409(self, client, mock_api):
        mock_api.post("/v1/auth/register").mock(
            return_value=httpx.Response(409, json={"detail": "exists"})
        )
        r = client.post("/api/auth/register", json={"email": "dup@example.com", "password": "Secret1!"})
        assert r.status_code == 409

    def test_register_missing_fields(self, client, mock_api):
        r = client.post("/api/auth/register", json={})
        assert r.status_code == 422


class TestLogin:
    def test_login_success(self, client, mock_api):
        mock_api.post("/v1/auth/login").mock(
            return_value=httpx.Response(200, json={"access_token": "tok", "token_type": "bearer"})
        )
        r = client.post("/api/auth/login", json={"email": "a@b.com", "password": "pw"})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_bad_creds(self, client, mock_api):
        mock_api.post("/v1/auth/login").mock(
            return_value=httpx.Response(401, json={"detail": "invalid"})
        )
        r = client.post("/api/auth/login", json={"email": "a@b.com", "password": "bad"})
        assert r.status_code == 401


class TestMe:
    def test_me_success(self, client, mock_api):
        mock_api.get("/v1/auth/me").mock(
            return_value=httpx.Response(200, json=FAKE_USER)
        )
        r = client.get("/api/auth/me", headers=AUTH_HEADER)
        assert r.status_code == 200
        assert r.json()["id"] == FAKE_USER["id"]

    def test_me_no_token(self, client, mock_api):
        r = client.get("/api/auth/me")
        assert r.status_code == 422


class TestRefresh:
    def test_refresh_success(self, client, mock_api):
        mock_api.post("/v1/auth/refresh").mock(
            return_value=httpx.Response(200, json={"access_token": "new-tok", "token_type": "bearer"})
        )
        r = client.post("/api/auth/refresh", json={"refresh_token": "rt"})
        assert r.status_code == 200
        assert r.json()["access_token"] == "new-tok"


class TestLogout:
    def test_logout(self, client, mock_api):
        mock_api.post("/v1/auth/logout").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post("/api/auth/logout", headers=AUTH_HEADER)
        assert r.status_code == 200


class TestOAuth:
    def test_oauth_callback(self, client, mock_api):
        mock_api.post("/v1/auth/github/callback").mock(
            return_value=httpx.Response(200, json={"access_token": "gh-tok"})
        )
        r = client.post("/api/auth/oauth/github/callback", json={"code": "abc123"})
        assert r.status_code == 200

    def test_oauth_callback_missing_code(self, client, mock_api):
        r = client.post("/api/auth/oauth/github/callback", json={})
        assert r.status_code == 422


class TestForgotPassword:
    def test_forgot_password(self, client, mock_api):
        mock_api.post("/v1/auth/forgot-password").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post("/api/auth/forgot-password", json={"email": "a@b.com"})
        assert r.status_code == 200


class TestResetPassword:
    def test_reset_password(self, client, mock_api):
        mock_api.post("/v1/auth/reset-password").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        r = client.post("/api/auth/reset-password", json={"token": "t", "new_password": "Pw1!"})
        assert r.status_code == 200
