def _flatten_row(row: dict) -> dict:
    """Flatten ZeroDB's {row_data: {...}, row_id: ...} into a flat dict."""
    if "row_data" not in row:
        return row
    flat = dict(row["row_data"])
    flat["id"] = row.get("row_id", row.get("id", ""))
    flat["_row_id"] = row.get("row_id", "")
    if "created_at" not in flat and row.get("created_at"):
        flat["created_at"] = row["created_at"]
    if "updated_at" not in flat and row.get("updated_at"):
        flat["updated_at"] = row["updated_at"]
    return flat


def paginate(zerodb_result: dict, *, limit: int, skip: int) -> dict:
    data = zerodb_result.get("data", [])
    total = zerodb_result.get("total", len(data))
    return {
        "items": [_flatten_row(r) for r in data],
        "total": total,
        "offset": skip,
        "limit": limit,
        "has_more": (skip + limit) < total,
    }
