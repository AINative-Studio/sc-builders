# PRD — Santa Cruz Builders: Community Communications Layer (Backend)

**Owner:** Toby Morning · **Author:** Engineering · **Status:** Draft v1 · **Date:** 2026-07-06
**Scope:** Backend only. Frontend (React + AI Kit) is a separate PRD.
**Constraint:** Ship a working MVP in **≤ 60 minutes** by maximizing AINative APIs/SDK and minimizing hand-written code.
**Stack:** Python + FastAPI · ZeroDB (via API/MCP) · AINative Community, Live-Streaming, Auth, and Event APIs · XP / TDD / BDD.

---

## 1. Thesis

> The backend is a **thin Backend-for-Frontend (BFF)**, not a system of record.

AINative already runs the database, auth, real-time transport, social graph, events, and search. Building "another" version of any of these is wasted time. Our backend exists only to do the things that *must* be server-side:

1. **Secret custody** — hold the AINative service key + ZeroDB project credentials; never ship them to the browser.
2. **Session & WS-token brokering** — exchange credentials for JWTs, refresh them, and mint short-lived `?token=` values for WebSocket chat.
3. **Channel lifecycle & registry** — create/track the AINative streams that back channels; store channel metadata.
4. **Announcements & notification fan-out** — write announcement records and emit ZeroDB events consumed as a notifications feed.
5. **Moderation & tenant policy** — thin authz on top of AINative badges; guarantee every call is scoped to the Santa Cruz Builders tenant.

Everything else (RSVP, follow/friend, search reads, comment reads) is either a **typed passthrough** or done **direct-to-AINative from the frontend** with the user's JWT. This is what keeps the code footprint tiny.

---

## 2. Concept → AINative primitive mapping

This table *is* the architecture. Every row we don't build ourselves.

| Community concept | AINative primitive | Base path | Backend role |
|---|---|---|---|
| Member accounts, login, OAuth | Auth (JWT + GitHub/LinkedIn OAuth) | `/v1/auth/*` | **broker** |
| Profiles + social stats | `GET /v1/auth/me`, Social stats | `/api/v1/social/me/stats` | passthrough |
| Follow / friend / block / mute | Social Graph | `/api/v1/social/*` | passthrough |
| **Channels** (`#general`, `#help`, `#jobs`) | Live-stream **stream** (chat plane only) | `/api/v1/streams/*` | **own** |
| Real-time channel messaging | Stream Chat **WebSocket** | `wss://…/streams/{id}/chat/ws?token=` | **mint token**; FE connects |
| Message history | Chat history REST (cursor) | `/api/v1/streams/{id}/chat/history` | passthrough |
| Channel roles / moderation | Stream moderators + badges | `/api/v1/streams/{id}/moderators` | policy + passthrough |
| Meetups + RSVP + calendar | Community Events | `/api/v1/community-events/*` | passthrough |
| Threaded discussion on resources | Community Comments | `/api/v1/community/comments/*` | passthrough |
| Unified search (people/events/posts) | Community Search | `/api/v1/community/search/` | passthrough |
| **Announcements** | ZeroDB NoSQL table + ZeroDB event | `/api/v1/projects/{pid}/database/tables/*` | **own** |
| **Notifications / activity feed** | ZeroDB Events (fan-out + state sync) | `/api/v1/public/zerodb/events` | **own** |
| Channel registry / app metadata | ZeroDB NoSQL Tables | `/api/v1/projects/{pid}/database/tables/*` | **own** |
| Semantic message/announcement search *(stretch)* | ZeroDB Vectors | `/api/v1/…/vectors` | stretch |

**Key repurpose — "stream = channel":** We use only the *chat plane* of an AINative stream (WebSocket + history + moderation + presence). No RTMPS/video is ever pushed. This gives real-time messaging, durable history, moderator badges, and live viewer/presence counts with zero backend messaging code. (See Risk R-1 for the verification spike.)

---

## 3. Endpoint inventory (from docs analysis)

Verified against `docs.ainative.studio`. Base URL for all runtime calls: `https://api.ainative.studio`.

**Auth** (`/v1/auth`): `register`, `login-json`, `refresh`, `me`, `logout`, `github/callback`, `linkedin/callback`, `forgot-password`, `reset-password`. JWT TTL = 8h; OAuth via GitHub + LinkedIn.

**Social Graph** (`/api/v1/social`): `follow/{id}` (POST/DELETE), `friend-request/{id}` (POST) + `/{req}/accept|decline` + DELETE, `block/{id}`, `ignore/{id}`, `{id}/followers|following|friends`, `me/friend-requests`, `me/stats`.

**Community Events** (`/api/v1/community-events`): CRUD on `/`, `/{id}`; `/{id}/rsvp` (POST), `rsvps/{rsvp_id}` (PATCH); `/{id}/attendees`, `/{id}/rsvps`, `my-events`, `browse`, `/{id}/export/ical`.

**Comments** (`/api/v1/community`): `comments` (POST, auth), `comments/{type}/{id}` (GET, **public**), `comments/{id}` (DELETE).

**Community Search** (`/api/v1/community/search`): `/?q=&search_type=all|users|posts|groups|events` plus dedicated `/users`, `/posts`, `/groups`, `/events`.

**Live-stream Chat** (`/api/v1/streams/{id}`): `chat/ws` (WSS, `?token=`), `chat/history` (cursor via `before`/`next_cursor`), `moderators` (GET/POST), `moderators/{uid}` (DELETE), `users/{uid}/badges`. Badges: `broadcaster`, `moderator`, `vip`, `subscriber`, `verified`. WS protocol: client sends `{type:"message"|"ping"}`; server sends `history`, `message`, `message_deleted`, `viewer_count`, `pong`, `error`.

**Streams** (`/api/v1/streams`): create/list/get/end. Stream-create rate limit = **10 req/min/user**.

**ZeroDB Tables** (`/api/v1/projects/{pid}/database/tables`): create table, insert row (`{row_data:{…}}`), `query` (Mongo-style `filters`, `sort`, `limit`, `skip`, `projection`), get/update/delete row, bulk update/delete.

**ZeroDB Events** (`/api/v1/public/zerodb/events`): POST `{type, data, source?, correlation_id?}`; GET with `type`, `start_time`, `limit`.

**Instant DB** (`/api/v1/public/instant-db`): 72-hour no-signup project + key — use for CI/local dev.

---

## 4. Backend API surface (what we actually implement)

All routes are tenant-scoped to Santa Cruz Builders. Legend: **[proxy]** ~3–6 LOC each · **[compose]** ~10–15 LOC · **[own]** ~15–25 LOC.

### 4.1 Auth (broker)
```
POST   /api/auth/register            → /v1/auth/register              [proxy]
POST   /api/auth/login               → /v1/auth/login-json            [proxy]
POST   /api/auth/refresh             → /v1/auth/refresh               [proxy]
GET    /api/auth/me                  → /v1/auth/me                    [proxy]
POST   /api/auth/logout              → /v1/auth/logout                [proxy]
POST   /api/auth/oauth/{provider}/callback → /v1/auth/{provider}/callback [proxy]
```

### 4.2 Channels (own + compose)
```
POST   /api/channels                 → create stream + insert `channels` row   [own]  (organizer-only)
GET    /api/channels                 → query `channels` table (+live counts)   [compose]
GET    /api/channels/{slug}          → row + stream detail                     [compose]
PATCH  /api/channels/{slug}          → update topic/visibility/archive         [own]
POST   /api/channels/{slug}/ws-token → mint short-lived channel-scoped JWT     [own]
```

### 4.3 Messaging (compose)
```
GET    /api/channels/{slug}/messages            → stream chat/history           [proxy]
POST   /api/channels/{slug}/moderators          → add moderator (policy)        [compose]
DELETE /api/channels/{slug}/moderators/{uid}    → remove moderator              [proxy]
```
> Real-time send/receive is **not** proxied. Frontend opens the WSS directly using the minted token. Backend never sits in the hot path.

### 4.4 Events (proxy)
```
POST/GET /api/events · GET/PATCH/DELETE /api/events/{id}
POST   /api/events/{id}/rsvp · GET /api/events/{id}/attendees
GET    /api/events/{id}/ical · GET /api/events/browse · GET /api/events/mine
```

### 4.5 Social (proxy — candidate for direct-from-frontend)
```
POST/DELETE /api/social/follow/{uid} · friend-request/* · block/{uid} · ignore/{uid}
GET    /api/social/{uid}/followers|following|friends · /api/social/me/stats
```

### 4.6 Announcements (own)
```
POST   /api/announcements            → insert row + emit ZeroDB event + system msg [own]
GET    /api/channels/{slug}/announcements → query rows                             [compose]
PATCH  /api/announcements/{id}       → pin/unpin/edit                              [own]
```

### 4.7 Notifications & search (own / proxy)
```
GET    /api/notifications            → read ZeroDB events by type + recency      [own]
GET    /api/search                   → /api/v1/community/search                   [proxy]
```

**Estimated hand-written backend:** ~300–450 LOC incl. models. One generic async proxy helper collapses every `[proxy]` route to a few lines.

---

## 5. Data model (ZeroDB tables — only what has no native primitive)

**`channels`**
```json
{ "slug": "general", "name": "General", "topic": "Anything SC builders",
  "stream_id": "<uuid>", "visibility": "public|private",
  "created_by": "<uuid>", "is_default": true, "archived": false }
```

**`announcements`**
```json
{ "channel_id": "<uuid|null>", "title": "…", "body": "…",
  "author_id": "<uuid>", "pinned": false, "published_at": "ISO-8601" }
```

**`member_directory`** *(optional enrichment beyond auth profile)*
```json
{ "user_id": "<uuid>", "display_name": "…", "skills": ["python","react"],
  "github": "…", "availability": "open_to_collab" }
```

**Notifications** are not a table — they are ZeroDB **events**, namespaced by type so the feed is a filtered query:
`community.announcement` · `community.event.created` · `community.event.rsvp` · `community.channel.created` · `community.mention`. Use `correlation_id` to group a workflow (e.g. an event + its RSVPs).

---

## 6. Component design (FastAPI)

Keep it flat and thin. Suggested modules:

- `config.py` — `pydantic-settings`: `AINATIVE_BASE_URL`, `ZERODB_PROJECT_ID`, `AINATIVE_API_KEY`, `TENANT_ID`.
- `client.py` — **one** async `httpx` client that injects auth + tenant, handles 401→refresh, and exposes `get/post/patch/delete`. Single source of all outbound HTTP.
- `proxy.py` — generic `forward(request, path)` helper powering every `[proxy]` route.
- `routers/` — `auth`, `channels`, `messages`, `events`, `social`, `announcements`, `notifications`, `search`.
- `zerodb.py` — tiny wrapper over Tables + Events (`insert`, `query`, `emit`, `list_events`).
- `models.py` — request/response Pydantic models (thin; mostly passthrough shapes).
- `deps.py` — `current_user` dependency (validates JWT via `/v1/auth/me` or local decode) + `require_organizer`.

**AI Kit boundary (backend obligations):** so the frontend's AI Kit hooks work without adaptation, the backend must (a) return list payloads in the platform's `{items,total,offset,limit}`/`{…,has_more}` shape, (b) expose the WS-token mint endpoint, and (c) never transform chat message shapes (frontend consumes the native stream-chat protocol directly).

---

## 7. 60-minute build plan (XP / TDD, vertical slices)

Each slice starts with a failing test (red → green → refactor). Time-boxed.

| Min | Slice | Failing test first | Done when |
|---|---|---|---|
| 0–10 | **Walking skeleton**: scaffold, `config`, `client`, auth passthrough | `test_login_returns_token` | `POST /api/auth/login` returns a JWT |
| 10–25 | **Channels**: create stream + `channels` row, list | `test_create_channel_creates_stream_and_row` | `POST /api/channels` yields `stream_id` + row; `GET` lists it |
| 25–40 | **Messaging**: WS-token mint + history proxy | `test_ws_token_scoped` / `test_history_proxy` | token mints; `GET …/messages` returns history |
| 40–50 | **Events + RSVP** passthrough | `test_create_event_and_rsvp` | event created; member RSVPs `going` |
| 50–60 | **Announcements + notifications + search** | `test_announce_emits_event_then_feed_shows_it` | announcement → event emitted → `GET /api/notifications` shows it |

**Order rationale:** each slice is demoable on its own; if the clock runs out, everything shipped already works end-to-end.

---

## 8. Testing strategy (TDD + BDD)

- **Unit / contract:** `pytest` + `respx` (or `httpx.MockTransport`) to mock AINative responses per endpoint. Every router has a contract test asserting method, path, auth header, tenant scoping, and error mapping (400/403/404/409).
- **BDD features** (`pytest-bdd`):
  - *"A builder joins #general and posts a message"* — login → list channels → mint WS token → post via WS → history reflects it.
  - *"An organizer creates a meetup and members RSVP"* — create event → browse → RSVP `going` → attendee count increments.
  - *"An organizer posts an announcement"* — announce → notifications feed contains `community.announcement`.
- **Integration smoke (CI):** spin a real 72-hour project via `POST /api/v1/public/instant-db`, run the happy path against live AINative, tear down. Gate merges on it.
- **Coverage target:** 100% of owned logic; proxies covered by contract tests.

---

## 9. Non-functional requirements

- **Tenant scoping:** every request carries the SC Builders tenant; users with no tenant association get `400` — provision all members into the tenant at signup.
- **Secrets:** service `sk_live_` key + ZeroDB project creds in env / secrets manager only. Browser never sees them.
- **WS tokens:** short-lived (≤ 15 min), channel-scoped, single-use where possible.
- **Rate limits:** respect stream-create 10/min/user — debounce channel creation; batch seed the default channels once at setup.
- **Pagination:** pass through `offset`/`limit`/`has_more` and chat `before`/`next_cursor` unchanged.
- **Transport:** HTTPS only; verify TLS.
- **Observability:** log every outbound AINative call with `correlation_id`; emit a `community.*` event for auditable actions.

---

## 10. Risks & spikes

- **R-1 — Stream-chat-as-channel (highest):** Does the chat WebSocket accept connections/messages **without an active RTMPS push** (stream in `offline`)? → **10-min spike** before slice 2. *Fallback:* if chat requires `live`, back channels with ZeroDB **Events** + an SSE relay for real-time, and `chat/history` semantics reimplemented over a `messages` table. This is the one assumption that can move the architecture.
- **R-2 — Tenant provisioning:** members must belong to the tenant or all community calls 400. Mitigation: enforce tenant assignment in the register/OAuth broker step.
- **R-3 — WS auth via query token:** tokens in URLs can leak via logs. Mitigation: short TTL + scope + strip from access logs.
- **R-4 — Comment content IDs are integers, not UUIDs:** the comments surface keys on `content_type` + numeric `content_id`. Map channels/resources to stable numeric IDs if we use native comments for threads.

---

## 11. Out of scope (this PRD)

Frontend/React/AI-Kit UI · video ingest/VOD · PAI Palooza advertising · billing/subscriptions · payments/Web3 · native mobile. Social/search reads *may* move to direct-from-frontend in the FE PRD to shrink the backend further.

---

## 12. Acceptance criteria (MVP "done")

1. A member can register/login (incl. GitHub OAuth) and fetch their profile.
2. An organizer can create channels; members can list them and connect to real-time chat with a minted token; history loads.
3. An organizer can create a meetup; members can RSVP and export iCal.
4. An organizer can post an announcement; it appears in every member's notifications feed.
5. Unified search returns people + events for a query.
6. All of the above pass the BDD suite and the CI integration smoke against a live instant-db project.
