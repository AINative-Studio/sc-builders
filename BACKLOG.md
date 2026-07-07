# SC-Builders Backlog

Derived from `prd.md` — Santa Cruz Builders Community Communications Layer (Backend).

## Shipped (v0.2.0)

### MVP APIs
- [x] Auth broker: register, login, refresh, me, logout, OAuth, forgot/reset password
- [x] Channels: CRUD (ZeroDB table), WS token minting (short-lived JWT with jti)
- [x] Messages: chat history proxy, moderator management
- [x] Events: CRUD proxy, RSVP, attendees, browse, my-events, iCal export
- [x] Social: follow/unfollow, friend requests, block, ignore, stats
- [x] Announcements: create (ZeroDB + event + vector embed), list, pinned, update
- [x] Notifications: ZeroDB events with read/unread tracking, mark read, mark all
- [x] Comments: POST/GET/DELETE proxy to AINative community
- [x] Members: directory CRUD (list, get, update own profile)
- [x] Search: community search proxy + semantic vector search
- [x] Health, Swagger /docs, ReDoc /redoc

### Infrastructure
- [x] Tenant provisioning (auto-assign on register/OAuth)
- [x] WS token hardening (jti unique ID)
- [x] Correlation ID middleware
- [x] CORS (configurable origins)
- [x] Rate limit middleware (slowapi)
- [x] Pagination normalization ({items, total, offset, limit, has_more})
- [x] Channel seeding script (idempotent)
- [x] Dockerfile + Procfile for Railway
- [x] .env.example

### Test Coverage
- [x] 136 tests, 96.4% coverage (target 90%)

## Remaining (non-code)

- [ ] #1 Stream-as-channel verification spike — manual WS test
- [ ] #15 CI integration smoke tests with instant-db
- [ ] #17 BDD feature files (pytest-bdd)
- [ ] #20 WebSocket connection developer guide
