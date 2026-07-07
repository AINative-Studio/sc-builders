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

## Phase 2 — Shipped (v0.2.0)

- [x] #2 Tenant provisioning at signup — auto-assign SC Builders tenant on register/OAuth
- [x] #3 WS token hardening — jti unique ID in tokens
- [x] #4 Comment thread support — POST/GET/DELETE comment proxy
- [x] #5 Correlation ID middleware — UUID per request, injected in responses
- [x] #7 Standardized error response — HTTPException propagation with upstream detail
- [x] #8 Member directory CRUD — list, get, update own profile (ZeroDB table)
- [x] #9 Default channel seeding script — idempotent, rate-limit aware
- [x] #10 Global pinned announcements endpoint
- [x] #11 Notification read/unread state tracking — mark read, mark all, unread count
- [x] #12 Rate limit middleware — slowapi wired in
- [x] #14 Dockerfile + Procfile for Railway
- [x] #16 Environment configuration — .env.example with all vars
- [x] #18 CORS configuration — configurable origins via env var
- [x] 127 tests, 96.5% coverage

## Remaining

- [ ] #1 Stream-as-channel verification spike (R-1) — needs manual WS testing
- [ ] #6 Pagination envelope normalization — audit all list endpoints for AI Kit shape
- [ ] #13 Semantic vector search (stretch) — ZeroDB Vectors embedding + search
- [ ] #15 CI integration smoke tests with instant-db
- [ ] #17 BDD feature files for acceptance criteria
- [ ] #19 AI Kit response shape audit
- [ ] #20 WebSocket connection developer guide
