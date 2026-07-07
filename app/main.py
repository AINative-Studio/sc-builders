from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.client import close_client
from app.config import settings
from app.middleware import CorrelationIdMiddleware
from app.routers import (
    announcements,
    auth,
    channels,
    comments,
    events,
    members,
    messages,
    notifications,
    search,
    social,
)

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await close_client()


app = FastAPI(
    title="SC Builders — Community API",
    description="Backend-for-Frontend for the Santa Cruz Builders community platform.",
    version="0.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(CorrelationIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(channels.router)
app.include_router(messages.router)
app.include_router(events.router)
app.include_router(social.router)
app.include_router(announcements.router)
app.include_router(notifications.router)
app.include_router(search.router)
app.include_router(comments.router)
app.include_router(members.router)


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok"}
