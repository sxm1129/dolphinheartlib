"""Authentication API routes: register, login, logout, get current user."""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field

from server.db import get_connection
from server.utils.auth import hash_password, verify_password, create_access_token, get_user_id_from_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


# Request/Response Models
class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    display_name: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class AuthUser(BaseModel):
    id: str
    username: str
    display_name: str
    plan: str


class LoginResponse(BaseModel):
    token: str
    user: AuthUser


class MeResponse(BaseModel):
    user: AuthUser


def _now_iso() -> str:
    """Return current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat()


def _get_user_by_username(username: str) -> Optional[dict]:
    """Fetch user by username from database."""
    with get_connection() as conn:
        cur = conn.execute(
            "SELECT id, username, password_hash, display_name, plan FROM users WHERE username = ?",
            (username,)
        )
        row = cur.fetchone()
    if row is None:
        return None
    # Handle both dict and tuple row types
    if hasattr(row, 'keys'):
        return dict(row)
    return {
        'id': row[0],
        'username': row[1],
        'password_hash': row[2],
        'display_name': row[3],
        'plan': row[4],
    }


def _get_user_by_id(user_id: str) -> Optional[dict]:
    """Fetch user by ID from database."""
    with get_connection() as conn:
        cur = conn.execute(
            "SELECT id, username, display_name, plan FROM users WHERE id = ?",
            (user_id,)
        )
        row = cur.fetchone()
    if row is None:
        return None
    if hasattr(row, 'keys'):
        return dict(row)
    return {
        'id': row[0],
        'username': row[1],
        'display_name': row[2],
        'plan': row[3],
    }


def _create_user(username: str, password: str, display_name: Optional[str] = None) -> str:
    """Create a new user in database and return user ID."""
    user_id = str(uuid.uuid4())
    password_hash = hash_password(password)
    display_name = display_name or username
    created_at = _now_iso()
    
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO users (id, username, password_hash, display_name, plan, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (user_id, username, password_hash, display_name, "Pro", created_at)
        )
        conn.commit()
    return user_id


@router.post("/register", response_model=LoginResponse)
async def register(req: RegisterRequest):
    """Register a new user."""
    # Check if username already exists
    existing = _get_user_by_username(req.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create user
    user_id = _create_user(req.username, req.password, req.display_name)
    
    # Generate token
    token = create_access_token({"sub": user_id})
    
    # Fetch created user
    user_data = _get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(status_code=500, detail="User creation failed")
    
    return LoginResponse(
        token=token,
        user=AuthUser(
            id=user_data['id'],
            username=user_data['username'],
            display_name=user_data['display_name'],
            plan=user_data['plan'],
        )
    )


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    """Authenticate user and return JWT token."""
    # Fetch user
    user_data = _get_user_by_username(req.username)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if not verify_password(req.password, user_data['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Generate token
    token = create_access_token({"sub": user_data['id']})
    
    return LoginResponse(
        token=token,
        user=AuthUser(
            id=user_data['id'],
            username=user_data['username'],
            display_name=user_data['display_name'],
            plan=user_data['plan'],
        )
    )


@router.get("/me", response_model=MeResponse)
async def get_me(authorization: Optional[str] = Header(None)):
    """Get current authenticated user info."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Extract token from "Bearer {token}"
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = parts[1]
    user_id = get_user_id_from_token(token)
    
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Fetch user
    user_data = _get_user_by_id(user_id)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    
    return MeResponse(
        user=AuthUser(
            id=user_data['id'],
            username=user_data['username'],
            display_name=user_data['display_name'],
            plan=user_data['plan'],
        )
    )


@router.post("/logout")
async def logout():
    """Logout endpoint (token revocation handled client-side)."""
    return {"message": "Logged out successfully"}
