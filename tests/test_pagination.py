from app.pagination import paginate


class TestPaginate:
    def test_basic_pagination(self):
        result = paginate({"data": [{"id": 1}], "total": 1}, limit=50, skip=0)
        assert result["items"] == [{"id": 1}]
        assert result["total"] == 1
        assert result["offset"] == 0
        assert result["limit"] == 50
        assert result["has_more"] is False

    def test_has_more_true(self):
        result = paginate({"data": [{"id": 1}], "total": 100}, limit=10, skip=0)
        assert result["has_more"] is True

    def test_has_more_false_at_end(self):
        result = paginate({"data": [{"id": 1}], "total": 10}, limit=10, skip=5)
        assert result["has_more"] is False

    def test_empty_data(self):
        result = paginate({"data": []}, limit=50, skip=0)
        assert result["items"] == []
        assert result["total"] == 0
        assert result["has_more"] is False

    def test_missing_total_falls_back_to_data_length(self):
        result = paginate({"data": [{"id": 1}, {"id": 2}]}, limit=50, skip=0)
        assert result["total"] == 2
