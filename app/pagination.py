def paginate(zerodb_result: dict, *, limit: int, skip: int) -> dict:
    data = zerodb_result.get("data", [])
    total = zerodb_result.get("total", len(data))
    return {
        "items": data,
        "total": total,
        "offset": skip,
        "limit": limit,
        "has_more": (skip + limit) < total,
    }
