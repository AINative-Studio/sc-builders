#!/usr/bin/env python3
"""
R-1 Spike: Stream-as-channel verification script.

Run when the AINative streams API goes live to verify chat-only mode works.
Usage: python scripts/verify_stream_chat.py
"""

import asyncio
import os
import sys

import httpx

BASE_URL = os.getenv("AINATIVE_BASE_URL", "https://api.ainative.studio")
EMAIL = os.getenv("AINATIVE_USERNAME", "admin@ainative.studio")
PASSWORD = os.getenv("AINATIVE_PASSWORD", "")


async def main():
    results: list[tuple[str, bool, str]] = []

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15) as c:
        # Step 1: Login
        r = await c.post(
            "/v1/auth/login", json={"email": EMAIL, "password": PASSWORD}
        )
        if r.status_code != 200:
            print(f"FAIL: Login returned {r.status_code}")
            sys.exit(1)

        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        results.append(("Login", True, f"Got token"))

        # Step 2: Check streams endpoint exists
        r = await c.get("/api/v1/streams", headers=headers)
        exists = r.status_code != 404
        results.append((
            "Streams API exists",
            exists,
            f"GET /api/v1/streams → {r.status_code}",
        ))

        if not exists:
            print("\n=== Stream-as-Channel Verification ===\n")
            for name, ok, detail in results:
                icon = "PASS" if ok else "FAIL"
                print(f"  [{icon}] {name}: {detail}")
            print(
                "\nStreams API not yet available. "
                "Re-run this script when the API is deployed."
            )
            sys.exit(0)

        # Step 3: Create a test stream
        r = await c.post(
            "/api/v1/streams",
            headers=headers,
            json={"title": "sc-builders-spike-test", "description": "R-1 spike"},
        )
        created = r.status_code in (200, 201)
        stream_id = r.json().get("id", "") if created else ""
        results.append(("Create stream", created, f"{r.status_code} → {stream_id}"))

        if not created:
            print("Cannot continue without a stream.")
            sys.exit(1)

        # Step 4: Chat history (should work even without RTMPS push)
        r = await c.get(
            f"/api/v1/streams/{stream_id}/chat/history",
            headers=headers,
            params={"limit": 10},
        )
        history_ok = r.status_code == 200
        results.append((
            "Chat history (offline stream)",
            history_ok,
            f"{r.status_code} — "
            + (f"{len(r.json().get('messages', []))} messages" if history_ok else r.text[:100]),
        ))

        # Step 5: WebSocket probe (connect only, don't send)
        ws_url = (
            BASE_URL.replace("https://", "wss://").replace("http://", "ws://")
            + f"/api/v1/streams/{stream_id}/chat/ws?token={token}"
        )
        ws_ok = False
        ws_detail = ""
        try:
            import websockets

            async with websockets.connect(ws_url, close_timeout=5) as ws:
                await asyncio.wait_for(ws.recv(), timeout=5)
                ws_ok = True
                ws_detail = "Connected and received initial frame"
        except ImportError:
            ws_detail = "websockets not installed — pip install websockets"
        except asyncio.TimeoutError:
            ws_ok = True
            ws_detail = "Connected (no initial frame within 5s — expected for idle stream)"
        except Exception as e:
            ws_detail = f"Connection failed: {e}"

        results.append(("WebSocket chat connect", ws_ok, ws_detail))

    # Report
    print("\n=== Stream-as-Channel Verification ===\n")
    all_pass = True
    for name, ok, detail in results:
        icon = "PASS" if ok else "FAIL"
        if not ok:
            all_pass = False
        print(f"  [{icon}] {name}: {detail}")

    print()
    if all_pass:
        print("All checks passed. Stream-as-channel pattern is viable.")
    else:
        print("Some checks failed. See details above.")
    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    asyncio.run(main())
