# WebSocket Connection Developer Guide

Frontend integration guide for SC-Builders real-time channel messaging.

## Architecture

```
┌──────────────┐       ┌──────────────────┐      ┌─────────────────────┐
│  React App   │──────▶│  SC-Builders BFF │─────▶│  AINative Streams   │
│  (browser)   │       │  (FastAPI)       │      │  (chat WS + REST)   │
└──────┬───────┘       └──────────────────┘      └──────────┬──────────┘
       │                                                     │
       │  1. POST /api/channels/{slug}/ws-token              │
       │     → { token, expires_in }                         │
       │                                                     │
       │  2. wss://api.ainative.studio/api/v1/streams/       │
       │     {stream_id}/chat/ws?token={ws_token}            │
       └─────────────────────────────────────────────────────┘
```

The backend mints a short-lived, channel-scoped JWT. The frontend uses this token to connect directly to AINative's WebSocket endpoint. The backend is never in the hot path for real-time messages.

## Step-by-Step Integration

### 1. Get a WS Token

```typescript
const response = await fetch(`/api/channels/${slug}/ws-token`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${userJwt}` },
});
const { token, expires_in } = await response.json();
```

**Token properties:**
- `jti`: unique ID (UUID v4) — prevents replay
- `sub`: user ID
- `channel_slug`: scoped to this channel only
- `stream_id`: the AINative stream backing this channel
- `exp`: expires in 15 minutes (configurable via `WS_TOKEN_TTL_SECONDS`)

### 2. Connect to WebSocket

```typescript
const channel = channels.find(c => c.slug === slug);
const wsUrl = `wss://api.ainative.studio/api/v1/streams/${channel.stream_id}/chat/ws?token=${token}`;
const ws = new WebSocket(wsUrl);
```

### 3. Handle Messages

The AINative chat WebSocket protocol sends/receives JSON frames:

```typescript
ws.onopen = () => {
  console.log('Connected to channel:', slug);
};

ws.onmessage = (event) => {
  const frame = JSON.parse(event.data);

  switch (frame.type) {
    case 'history':
      // Initial message history on connect
      // frame.messages: Message[]
      setMessages(frame.messages);
      break;

    case 'message':
      // New message from any user
      // frame.message: { id, user_id, content, created_at }
      appendMessage(frame.message);
      break;

    case 'message_deleted':
      // Moderator deleted a message
      // frame.message_id: string
      removeMessage(frame.message_id);
      break;

    case 'viewer_count':
      // Live presence count
      // frame.count: number
      setViewerCount(frame.count);
      break;

    case 'pong':
      // Response to client ping
      break;

    case 'error':
      // Server error
      // frame.message: string
      console.error('WS error:', frame.message);
      break;
  }
};
```

### 4. Send Messages

```typescript
function sendMessage(content: string) {
  ws.send(JSON.stringify({
    type: 'message',
    content,
  }));
}
```

### 5. Keep-Alive Pings

Send pings every 30 seconds to prevent idle disconnection:

```typescript
const pingInterval = setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30_000);

ws.onclose = () => {
  clearInterval(pingInterval);
};
```

## Token Refresh Strategy

WS tokens expire after 15 minutes. Implement proactive refresh:

```typescript
class ChannelConnection {
  private ws: WebSocket | null = null;
  private refreshTimer: number | null = null;

  async connect(slug: string, userJwt: string) {
    const { token, expires_in } = await this.mintToken(slug, userJwt);
    this.openSocket(slug, token);

    // Refresh 60s before expiry
    this.refreshTimer = setTimeout(
      () => this.reconnect(slug, userJwt),
      (expires_in - 60) * 1000,
    );
  }

  private async mintToken(slug: string, jwt: string) {
    const r = await fetch(`/api/channels/${slug}/ws-token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${jwt}` },
    });
    return r.json();
  }

  private openSocket(slug: string, token: string) {
    // Close existing connection gracefully
    if (this.ws) this.ws.close(1000);

    const channel = this.getChannel(slug);
    const url = `wss://api.ainative.studio/api/v1/streams/${channel.stream_id}/chat/ws?token=${token}`;
    this.ws = new WebSocket(url);
    // ... attach handlers
  }

  private async reconnect(slug: string, jwt: string) {
    await this.connect(slug, jwt);
  }

  disconnect() {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    if (this.ws) this.ws.close(1000);
  }
}
```

## React Hook Example

```typescript
import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export function useChannelChat(slug: string, userJwt: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [connected, setConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!slug || !userJwt) return;

    let cancelled = false;
    let pingInterval: number;

    async function connect() {
      // 1. Mint token
      const r = await fetch(`/api/channels/${slug}/ws-token`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userJwt}` },
      });
      if (!r.ok || cancelled) return;
      const { token } = await r.json();

      // 2. Get channel stream_id
      const chRes = await fetch(`/api/channels/${slug}`, {
        headers: { 'Authorization': `Bearer ${userJwt}` },
      });
      if (!chRes.ok || cancelled) return;
      const channel = await chRes.json();

      // 3. Open WS
      const url = `wss://api.ainative.studio/api/v1/streams/${channel.stream_id}/chat/ws?token=${token}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!cancelled) setConnected(true);
        pingInterval = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30_000);
      };

      ws.onmessage = (e) => {
        const frame = JSON.parse(e.data);
        if (frame.type === 'history') setMessages(frame.messages || []);
        if (frame.type === 'message') setMessages(prev => [...prev, frame.message]);
        if (frame.type === 'message_deleted') {
          setMessages(prev => prev.filter(m => m.id !== frame.message_id));
        }
        if (frame.type === 'viewer_count') setViewerCount(frame.count);
      };

      ws.onclose = () => {
        if (!cancelled) setConnected(false);
        clearInterval(pingInterval);
      };
    }

    connect();

    return () => {
      cancelled = true;
      if (wsRef.current) wsRef.current.close(1000);
    };
  }, [slug, userJwt]);

  const send = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'message', content }));
    }
  }, []);

  return { messages, connected, viewerCount, send };
}
```

## Message History (REST Fallback)

When WebSocket is unavailable (streams API not yet deployed), use the REST history endpoint:

```typescript
async function fetchHistory(slug: string, jwt: string, before?: string) {
  const params = new URLSearchParams({ limit: '50' });
  if (before) params.set('before', before);

  const r = await fetch(`/api/channels/${slug}/messages?${params}`, {
    headers: { 'Authorization': `Bearer ${jwt}` },
  });
  return r.json();
}
```

## Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| WS close code 1008 | Token expired or invalid | Re-mint token and reconnect |
| WS close code 4001 | Not authorized for channel | Check channel membership |
| WS close code 4004 | Stream not found | Channel may be archived |
| HTTP 404 on ws-token | Channel slug not found | Verify channel exists |
| HTTP 429 on ws-token | Rate limited (10/min) | Back off, retry after header |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `POST /api/channels/{slug}/ws-token` | 10 requests/minute |
| `POST /api/channels` | 10 requests/minute |
| All other endpoints | 100 requests/minute |

## Current Status

The AINative streams API (`/api/v1/streams/*`) is not yet deployed. The backend generates placeholder `stream_id` values. When the API goes live:

- WS token minting already works (JWT with stream_id claim)
- History proxy already points to the correct path
- No frontend code changes needed — just the stream_id will resolve to a real stream

Until then, use the REST history endpoint as a polling fallback.
