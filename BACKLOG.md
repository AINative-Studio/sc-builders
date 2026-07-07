# SC-Builders Backlog

Derived from `prd.md` — Santa Cruz Builders Community Communications Layer (Backend).

## MVP — Shipped (v0.1.0)

- [x] Walking skeleton: FastAPI app, config, httpx client, proxy helper
- [x] Auth broker: register, login, refresh, me, logout, OAuth callback, forgot/reset password
- [x] Channels: CRUD (ZeroDB table), WS token minting (short-lived JWT)
- [x] Messages: chat history proxy, moderator management
- [x] Events: CRUD proxy, RSVP, attendees, browse, my-events, iCal export
- [x] Social: follow/unfollow, friend requests, block, ignore, followers/following/friends, stats
- [x] Announcements: create (ZeroDB + event emission), list by channel, update/pin
- [x] Notifications: ZeroDB events query with type filter
- [x] Search: community search proxy (all/users/posts/groups/events)
- [x] Swagger/OpenAPI at /docs + ReDoc at /redoc
- [x] Health endpoint
- [x] 88 tests, 95% coverage

## Phase 2 — Hardening & Integration

1. **Stream-as-channel verification spike (R-1)** — Verify chat WebSocket works with stream in `offline` state (no RTMPS push). If not, fall back to ZeroDB Events + SSE relay for real-time messaging.
2. **Tenant provisioning at signup (R-2)** — Enforce SC Builders tenant assignment in the register/OAuth broker step. Members without tenant get `400`.
3. **WS token hardening (R-3)** — Add single-use token support, strip tokens from access logs, add rate limiting to ws-token endpoint.
4. **Comment thread support (R-4)** — Map channels to stable numeric content_id for AINative community comments. Wire `POST/GET/DELETE /api/comments`.
5. **Correlation ID logging** — Log every outbound AINative call with `correlation_id` for observability.
6. **Pagination envelope normalization** — Ensure all list endpoints return `{items, total, offset, limit, has_more}` shape for AI Kit frontend compatibility.
7. **Error response standardization** — Uniform error envelope across all endpoints (`{detail, code, correlation_id}`).

## Phase 3 — Enhanced Features

8. **Member directory** — ZeroDB `member_directory` table: skills, GitHub handle, availability. CRUD endpoints.
9. **Channel default seeding** — One-time setup script to batch-create default channels (`#general`, `#help`, `#jobs`, `#events`, `#introductions`).
10. **Announcement pinning feed** — Global pinned announcements endpoint (across all channels).
11. **Notification read/unread state** — Track read status per user (ZeroDB table or event-based).
12. **Rate limit middleware** — Respect stream-create 10/min/user limit; add FastAPI rate limiter for public endpoints.
13. **Semantic search (stretch)** — ZeroDB Vectors for message/announcement embedding + search.

## Phase 4 — Deployment & CI

14. **Dockerfile + Railway config** — Multi-stage Docker build, Railway deploy config, health check.
15. **CI integration smoke tests** — Spin up 72-hour instant-db project, run happy path against live AINative, tear down.
16. **Environment configuration** — Railway env var setup, secrets management, production vs staging config.
17. **BDD feature files** — Full pytest-bdd scenarios matching PRD acceptance criteria.

## Phase 5 — Frontend Prep

18. **CORS configuration** — Allow frontend origins for local dev and production.
19. **AI Kit response shape audit** — Verify all endpoints match AI Kit expected shapes.
20. **WebSocket connection docs** — Developer guide for frontend WS token flow.
