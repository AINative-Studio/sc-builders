class TestHealth:
    def test_health_check(self, client, mock_api):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_swagger_docs(self, client, mock_api):
        r = client.get("/docs")
        assert r.status_code == 200

    def test_redoc(self, client, mock_api):
        r = client.get("/redoc")
        assert r.status_code == 200
