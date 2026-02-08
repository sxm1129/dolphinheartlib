"""Task CRUD against SQLite."""
import json
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional

from server.db import get_connection
from server.models import Task, TaskStatus

STATUS_PENDING = TaskStatus.pending.name
STATUS_RUNNING = TaskStatus.running.name
STATUS_COMPLETED = TaskStatus.completed.name
STATUS_FAILED = TaskStatus.failed.name


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def create_task(task_type: str, params: dict, project_id: Optional[str] = None) -> str:
    """Insert a new task with status pending. Returns task_id."""
    task_id = str(uuid.uuid4())
    _create_task_row(task_id, task_type, params, project_id)
    return task_id


def create_task_with_id(task_id: str, task_type: str, params: dict, project_id: Optional[str] = None) -> None:
    """Insert a task with given id and status pending."""
    _create_task_row(task_id, task_type, params, project_id)


def _create_task_row(task_id: str, task_type: str, params: dict, project_id: Optional[str] = None) -> None:
    now = _now_iso()
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO tasks (id, type, status, created_at, updated_at, params, project_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (task_id, task_type, STATUS_PENDING, now, now, json.dumps(params), project_id),
        )
        conn.commit()


def get_task(task_id: str) -> Optional[Task]:
    """Return task by id or None."""
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    if row is None:
        return None
    return Task.from_row(row)


def list_tasks(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    task_type: Optional[str] = None,
    project_id: Optional[str] = None,
) -> tuple[List[Task], int]:
    """Return (items for page, total count)."""
    conditions = []
    args: List[Any] = []
    if status is not None:
        conditions.append("status = ?")
        args.append(status)
    if task_type is not None:
        conditions.append("type = ?")
        args.append(task_type)
    if project_id is not None:
        conditions.append("project_id = ?")
        args.append(project_id)
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    count_sql = f"SELECT COUNT(*) AS total FROM tasks {where}"
    with get_connection() as conn:
        row = conn.execute(count_sql, args).fetchone()
        if row is None:
            total = 0
        else:
            try:
                total = row["total"]
            except (TypeError, KeyError):
                try:
                    total = row[0]
                except (TypeError, KeyError):
                    total = next(iter(row.values()), 0)
        offset = (page - 1) * page_size
        args.extend([page_size, offset])
        rows = conn.execute(
            f"SELECT * FROM tasks {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            args,
        ).fetchall()
    items = [Task.from_row(r) for r in rows]
    return items, total


def update_task(task_id: str, **fields: Any) -> bool:
    """Update given columns for task. Returns True if a row was updated."""
    allowed = {
        "status",
        "updated_at",
        "params",
        "output_audio_path",
        "result",
        "error_message",
    }
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        return False
    if "updated_at" not in updates:
        updates["updated_at"] = _now_iso()
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = []
    for k in updates:
        v = updates[k]
        if k in ("params", "result") and isinstance(v, dict):
            values.append(json.dumps(v))
        else:
            values.append(v)
    values.append(task_id)
    with get_connection() as conn:
        cur = conn.execute(
            f"UPDATE tasks SET {set_clause} WHERE id = ?",
            values,
        )
        conn.commit()
    return cur.rowcount > 0


def has_completed_generate_task(project_id: str) -> bool:
    """Return True if the project has at least one completed generate task."""
    if not project_id:
        return False
    tasks_list, _ = list_tasks(project_id=project_id, status=STATUS_COMPLETED, task_type="generate", page_size=1)
    return len(tasks_list) > 0
