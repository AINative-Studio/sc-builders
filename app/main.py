from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.client import close_client
from app.routers import (
    announcements,
    auth,
    channels,
    events,
    messages,
    notifications,
    search,
    social,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_client()


app = FastAPI(
    title="SC Builders — Community API",
    description="Backend-for-Frontend for the Santa Cruz Builders community platform.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(auth.router)
app.include_router(channels.router)
app.include_router(messages.router)
app.include_router(events.router)
app.include_router(social.router)
app.include_router(announcements.router)
app.include_router(notifications.router)
app.include_router(search.router)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
