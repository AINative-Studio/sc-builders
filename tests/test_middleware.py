class TestCorrelationId:
    def test_correlation_id_generated(self, client, mock_api):
        r = client.get("/health")
        assert r.status_code == 200
        assert "x-correlation-id" in r.headers
        assert len(r.headers["x-correlation-id"]) == 36

    def test_correlation_id_passthrough(self, client, mock_api):
        r = client.get("/health", headers={"X-Correlation-ID": "custom-cid-123"})
        assert r.status_code == 200
        assert r.headers["x-correlation-id"] == "custom-cid-123"


class TestCORS:
    def test_cors_preflight(self, client, mock_api):
        r = client.options(
            "/api/auth/login",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Authorization,Content-Type",
            },
        )
        assert r.status_code == 200
        assert "access-control-allow-origin" in r.headers

    def test_cors_headers_on_response(self, client, mock_api):
        r = client.get("/health", headers={"Origin": "http://localhost:3000"})
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"
