"""Simple auth: login with username/password, in-memory token store."""
import uuid
from typing import Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel

from server.db import verify_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


# In-memory token -> user info (simple; tokens invalidate on server restart)
_tokens: dict[str, dict] = {}


@router.post("/login")
def login(body: LoginRequest):
    """Verify credentials and return token + user info. Username: admin, Password: Admin123! (default)."""
    user = verify_user(body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = str(uuid.uuid4())
    _tokens[token] = {
        "id": user["id"],
        "username": user["username"],
        "display_name": user["display_name"],
        "plan": user["plan"],
    }
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "display_name": user["display_name"],
            "plan": user["plan"],
        },
    }


@router.get("/me")
def me(authorization: Optional[str] = Header(None)):
    """Return current user from Bearer token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:].strip()
    user = _tokens.get(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return {"user": user}


@router.post("/logout")
def logout(authorization: Optional[str] = Header(None)):
    """Invalidate token (remove from server memory)."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
        _tokens.pop(token, None)
    return {"ok": True}
