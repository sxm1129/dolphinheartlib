"""Shares API: Create and retrieve public share links."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
import json

from server.db import get_connection
from server.store import get_task

router = APIRouter(prefix="/api/shares", tags=["shares"])


class ShareCreateRequest(BaseModel):
    task_id: str
    title: Optional[str] = None


class ShareResponse(BaseModel):
    id: str
    task_id: str
    title: Optional[str] = None
    created_at: str
    view_count: int = 0


class ShareDetailResponse(BaseModel):
    id: str
    task_id: str
    title: Optional[str] = None
    created_at: str
    view_count: int = 0
    task: Optional[Dict[str, Any]] = None


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _create_share(task_id: str, title: Optional[str] = None) -> str:
    """Create a share record and return share_id."""
    share_id = str(uuid.uuid4())[:8]  # Short 8-char ID for sharing
    now = _now_iso()
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO shares (id, task_id, title, created_at, view_count)
               VALUES (?, ?, ?, ?, ?)""",
            (share_id, task_id, title, now, 0),
        )
        conn.commit()
    return share_id


def _get_share(share_id: str) -> Optional[dict]:
    """Get share by id."""
    with get_connection() as conn:
        cur = conn.execute("SELECT * FROM shares WHERE id = ?", (share_id,))
        row = cur.fetchone()
    if row is None:
        return None
    # Convert row to dict (works for both MySQL DictCursor and SQLite Row)
    if hasattr(row, 'keys'):
        return dict(row)
    return {
        'id': row[0],
        'task_id': row[1],
        'title': row[2],
        'created_at': row[3],
        'expires_at': row[4],
        'view_count': row[5],
    }


def _increment_view_count(share_id: str) -> None:
    """Increment view count for share."""
    with get_connection() as conn:
        conn.execute(
            "UPDATE shares SET view_count = view_count + 1 WHERE id = ?",
            (share_id,),
        )
        conn.commit()


@router.post("", response_model=ShareResponse)
async def create_share(req: ShareCreateRequest):
    """Create a public share link for a task."""
    # Verify task exists
    task = get_task(req.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.status != "completed":
        raise HTTPException(status_code=400, detail="Can only share completed tasks")
    
    share_id = _create_share(req.task_id, req.title)
    share = _get_share(share_id)
    return ShareResponse(
        id=share['id'],
        task_id=share['task_id'],
        title=share['title'],
        created_at=share['created_at'],
        view_count=share['view_count'] or 0,
    )


@router.get("/{share_id}", response_model=ShareDetailResponse)
async def get_share_detail(share_id: str):
    """Get share details including task info (public endpoint)."""
    share = _get_share(share_id)
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    # Increment view count
    _increment_view_count(share_id)
    
    # Get task details
    task = get_task(share['task_id'])
    task_data = None
    if task:
        params = task.params
        if isinstance(params, str):
            try:
                params = json.loads(params)
            except:
                params = {}
        task_data = {
            'id': task.id,
            'status': task.status,
            'output_audio_path': task.output_audio_path,
            'params': params,
            'created_at': task.created_at,
        }
    
    return ShareDetailResponse(
        id=share['id'],
        task_id=share['task_id'],
        title=share['title'],
        created_at=share['created_at'],
        view_count=(share['view_count'] or 0) + 1,
        task=task_data,
    )
