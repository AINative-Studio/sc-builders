# R-1 Spike: Stream-as-Channel Verification

**Issue:** #1
**Date:** 2026-07-06
**Status:** CONFIRMED — streams API not yet deployed; mitigation in place

## Objective

Verify that AINative live-stream chat WebSockets work in "offline" mode (chat plane only, no RTMPS video push) so we can repurpose streams as persistent channel messaging.

## Test Method

Probed the AINative production API (`api.ainative.studio`) with authenticated requests against every plausible streams endpoint path:

```
GET /api/v1/streams         → 404
GET /v1/streams             → 404
GET /api/v1/live/streams    → 404
GET /api/v1/live-streams    → 404
GET /api/streams            → 404
POST /api/v1/streams        → 404
```

Also probed `live.ainative.studio`:
```
GET /health                 → 404
GET /api/v1/streams         → 404
```

## Findings

1. **The `/api/v1/streams/*` endpoints documented in the PRD are not live.** All paths return `404 NOT_FOUND`. The live-streaming service is either not yet deployed to production or is behind a feature flag.

2. **Current mitigation works.** The SC-Builders backend generates a `stream_id` (UUID v4) locally and stores it in the ZeroDB `channels` table. No actual stream is created on AINative. This means:
   - Channel CRUD (create, list, get, update) works perfectly via ZeroDB tables.
   - WS token minting works (generates a signed JWT with the local `stream_id`).
   - Chat history proxy (`GET /api/channels/{slug}/messages`) will 404 at AINative since the stream doesn't exist there.
   - WebSocket connections (`wss://…/streams/{id}/chat/ws?token=`) cannot be established.

3. **No blocking impact on MVP.** The channels, announcements, notifications, events, social, members, comments, and search features all work without the streams API. Only real-time chat and message history are affected.

## Architecture Decision

The channel registry is **decoupled from stream lifecycle**. When the streams API goes live:

1. `POST /api/channels` will call `POST /api/v1/streams` to create an actual stream, then store the returned `stream_id`.
2. The WS token, history proxy, and moderator endpoints will work immediately — they already use the correct paths.
3. No schema changes needed. The `stream_id` field in the `channels` table already exists.

## Verification Script

A verification script is provided at `scripts/verify_stream_chat.py`. Run it when the streams API is deployed:

```bash
cd sc-builders
python scripts/verify_stream_chat.py
```

It will:
1. Authenticate via `/v1/auth/login`
2. Create a stream via `POST /api/v1/streams`
3. Get chat history (should return empty)
4. Attempt a WebSocket connection to the chat endpoint
5. Report pass/fail for each step

## Recommendation

- **Ship the MVP without real-time chat.** All other features work.
- **Track streams API availability** as a separate issue. When it goes live, the integration is a ~20-line change in `channels.py`.
- **Consider a polling fallback** for v1: frontend polls `GET /api/channels/{slug}/messages` every 5s until WS is available.
