"""Project CRUD operations against MySQL/SQLite."""
import json
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional, Tuple

from server.db import get_connection
from server.models import Project


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_project(
    title: str,
    genre: str = "",
    tags: Optional[List[str]] = None,
    status: str = "Draft",
    color: str = "bg-primary",
) -> str:
    """Insert a new project. Returns project_id."""
    project_id = str(uuid.uuid4())
    now = _now_iso()
    tags_json = json.dumps(tags or [])
    
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO projects (id, title, genre, tags, duration, status, color, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (project_id, title, genre, tags_json, "", status, color, now, now),
        )
        conn.commit()
    return project_id


def get_project(project_id: str) -> Optional[Project]:
    """Return project by id or None."""
    with get_connection() as conn:
        cursor = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
    if row is None:
        return None
    return Project.from_row(row)


def list_projects(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    search: Optional[str] = None,
    genre: Optional[str] = None,
) -> Tuple[List[Project], int]:
    """Return (items for page, total count)."""
    conditions = []
    args: List[Any] = []
    
    if status is not None:
        conditions.append("status = ?")
        args.append(status)
    if genre is not None:
        conditions.append("genre = ?")
        args.append(genre)
    if search is not None:
        conditions.append("(title LIKE ? OR tags LIKE ?)")
        search_pattern = f"%{search}%"
        args.extend([search_pattern, search_pattern])
    
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    count_sql = f"SELECT COUNT(*) FROM projects {where}"
    
    with get_connection() as conn:
        cursor = conn.execute(count_sql, tuple(args))
        row = cursor.fetchone()
        total = row[0] if isinstance(row, tuple) else row.get("COUNT(*)", 0)
        
        offset = (page - 1) * page_size
        args.extend([page_size, offset])
        rows = conn.execute(
            f"SELECT * FROM projects {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            tuple(args),
        ).fetchall()
    
    items = [Project.from_row(r) for r in rows]
    return items, total


def update_project(project_id: str, **fields: Any) -> bool:
    """Update given columns for project. Returns True if a row was updated."""
    allowed = {"title", "genre", "tags", "duration", "status", "color"}
    updates = {k: v for k, v in fields.items() if k in allowed and v is not None}
    
    if not updates:
        return False
    
    updates["updated_at"] = _now_iso()
    
    # Handle tags serialization
    if "tags" in updates and isinstance(updates["tags"], list):
        updates["tags"] = json.dumps(updates["tags"])
    
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values())
    values.append(project_id)
    
    with get_connection() as conn:
        cur = conn.execute(
            f"UPDATE projects SET {set_clause} WHERE id = ?",
            tuple(values),
        )
        conn.commit()
    return cur.rowcount > 0


def delete_project(project_id: str) -> bool:
    """Delete a project by id. Returns True if a row was deleted."""
    with get_connection() as conn:
        cur = conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
        conn.commit()
    return cur.rowcount > 0
