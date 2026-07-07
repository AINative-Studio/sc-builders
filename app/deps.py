from fastapi import Depends, Header, HTTPException, status

from app.client import api_request


async def get_token(authorization: str = Header(...)) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )
    return authorization.removeprefix("Bearer ")


async def current_user(token: str = Depends(get_token)) -> dict:
    r = await api_request("GET", "/v1/auth/me", bearer_token=token)
    if r.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return r.json()


async def require_organizer(user: dict = Depends(current_user)) -> dict:
    role = user.get("role", "").lower()
    if role not in ("admin", "organizer", "superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizer role required",
        )
    return user
