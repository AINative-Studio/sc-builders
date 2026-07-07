import asyncio
import json
import logging
from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.config import settings
from app.zerodb import insert_row

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])

TABLE = "messages"


class ConnectionManager:
    def __init__(self):
        self._channels: dict[str, list[WebSocket]] = {}

    async def connect(self, channel: str, ws: WebSocket):
        await ws.accept()
        self._channels.setdefault(channel, []).append(ws)

    def disconnect(self, channel: str, ws: WebSocket):
        conns = self._channels.get(channel, [])
        if ws in conns:
            conns.remove(ws)
        if not conns:
            self._channels.pop(channel, None)

    async def broadcast(self, channel: str, message: dict):
        for ws in list(self._channels.get(channel, [])):
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(channel, ws)

    @property
    def stats(self) -> dict:
        return {ch: len(conns) for ch, conns in self._channels.items()}


manager = ConnectionManager()


def _verify_ws_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


@router.websocket("/ws/chat")
async def community_chat_ws(websocket: WebSocket, token: str | None = None):
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    payload = _verify_ws_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid or expired token")
        return

    user_id = payload.get("sub", "")
    channel_slug = payload.get("channel_slug", "")
    if not channel_slug:
        await websocket.close(code=4002, reason="Token missing channel_slug")
        return

    await manager.connect(channel_slug, websocket)
    logger.info("WS connected: user=%s channel=%s", user_id, channel_slug)

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                msg = {"content": data}

            content = msg.get("content", "").strip()
            if not content:
                continue

            now = datetime.now(timezone.utc).isoformat()
            sender_name = msg.get("sender_name", "")

            row = {
                "channel_slug": channel_slug,
                "sender_id": user_id,
                "sender_name": sender_name,
                "content": content,
                "sent_at": now,
            }
            try:
                await insert_row(TABLE, row)
            except Exception as exc:
                logger.warning("Failed to persist message: %s", exc)

            broadcast_msg = {
                "type": "message",
                "channel_slug": channel_slug,
                "sender_id": user_id,
                "sender_name": sender_name,
                "content": content,
                "sent_at": now,
            }
            await manager.broadcast(channel_slug, broadcast_msg)

    except WebSocketDisconnect:
        manager.disconnect(channel_slug, websocket)
        logger.info("WS disconnected: user=%s channel=%s", user_id, channel_slug)


@router.get("/ws/stats")
async def ws_stats():
    return {"connections": manager.stats}
