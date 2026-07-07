import httpx
import pytest
import respx

from app.config import settings
from app.seed_channels import DEFAULT_CHANNELS, seed


def _table_prefix():
    return f"/api/v1/projects/{settings.project_id}/database/tables/channels"


@pytest.mark.asyncio
async def test_seed_creates_channels():
    with respx.mock(base_url=settings.ainative_base_url, assert_all_called=False) as m:
        m.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": []})
        )
        m.post(f"{_table_prefix()}/rows").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        await seed()
        assert m.post(f"{_table_prefix()}/rows").call_count == len(DEFAULT_CHANNELS)


@pytest.mark.asyncio
async def test_seed_skips_existing():
    with respx.mock(base_url=settings.ainative_base_url, assert_all_called=False) as m:
        m.post(f"{_table_prefix()}/query").mock(
            return_value=httpx.Response(200, json={"data": [{"slug": "existing"}]})
        )
        m.post(f"{_table_prefix()}/rows").mock(
            return_value=httpx.Response(200, json={"ok": True})
        )
        await seed()
        assert m.post(f"{_table_prefix()}/rows").call_count == 0
