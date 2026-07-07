"""Seed default channels for SC Builders community.

Usage: python -m app.seed_channels
"""

import asyncio
import uuid

from app.zerodb import insert_row, query_rows

DEFAULT_CHANNELS = [
    {"slug": "general", "name": "General", "topic": "Anything SC builders"},
    {"slug": "help", "name": "Help", "topic": "Ask for help with your projects"},
    {"slug": "jobs", "name": "Jobs", "topic": "Job postings and opportunities"},
    {"slug": "events", "name": "Events", "topic": "Community events and meetups"},
    {"slug": "introductions", "name": "Introductions", "topic": "Introduce yourself to the community"},
]

TABLE = "channels"


async def seed():
    created = 0
    skipped = 0
    for ch in DEFAULT_CHANNELS:
        existing = await query_rows(TABLE, filters={"slug": {"$eq": ch["slug"]}}, limit=1)
        if existing.get("data"):
            print(f"  skip: #{ch['slug']} already exists")
            skipped += 1
            continue

        row = {
            **ch,
            "stream_id": str(uuid.uuid4()),
            "visibility": "public",
            "created_by": "system",
            "is_default": True,
            "archived": False,
        }
        await insert_row(TABLE, row)
        print(f"  created: #{ch['slug']}")
        created += 1
        await asyncio.sleep(6)

    print(f"\nDone: {created} created, {skipped} skipped")


if __name__ == "__main__":
    asyncio.run(seed())
