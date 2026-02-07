"""Task and Project models and enums aligned with DB schema."""
import json
from enum import Enum
from typing import Any, List, Optional

TaskType = Enum("TaskType", ["generate", "transcribe"])
TaskStatus = Enum("TaskStatus", ["pending", "running", "completed", "failed"])
ProjectStatus = Enum("ProjectStatus", ["Draft", "Generated", "Mastered"])


def task_type_to_str(t: TaskType) -> str:
    return t.name


def task_status_to_str(s: TaskStatus) -> str:
    return s.name


def str_to_task_type(s: str) -> TaskType:
    return TaskType[s] if s in TaskType.__members__ else TaskType.generate


def str_to_task_status(s: str) -> TaskStatus:
    return TaskStatus[s] if s in TaskStatus.__members__ else TaskStatus.pending


class Task:
    """In-memory task representation matching tasks table."""

    def __init__(
        self,
        id: str,
        type: str,
        status: str,
        created_at: str,
        updated_at: str,
        params: str,
        output_audio_path: Optional[str] = None,
        result: Optional[str] = None,
        error_message: Optional[str] = None,
    ):
        self.id = id
        self.type = type
        self.status = status
        self.created_at = created_at
        self.updated_at = updated_at
        self.params = params
        self.output_audio_path = output_audio_path
        self.result = result
        self.error_message = error_message

    @classmethod
    def from_row(cls, row: Any) -> "Task":
        # Support both dict (MySQL) and sqlite3.Row
        if hasattr(row, 'keys'):
            return cls(
                id=row["id"],
                type=row["type"],
                status=row["status"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                params=row["params"],
                output_audio_path=row["output_audio_path"],
                result=row["result"],
                error_message=row["error_message"],
            )
        return cls(*row)


class Project:
    """In-memory project representation matching projects table."""

    def __init__(
        self,
        id: str,
        title: str,
        genre: Optional[str],
        tags: Optional[str],
        duration: str,
        status: str,
        color: str,
        created_at: str,
        updated_at: str,
    ):
        self.id = id
        self.title = title
        self.genre = genre or ""
        self._tags_raw = tags or "[]"
        self.duration = duration or ""
        self.status = status or "Draft"
        self.color = color or "bg-primary"
        self.created_at = created_at
        self.updated_at = updated_at

    @property
    def tags(self) -> List[str]:
        """Parse tags from JSON string."""
        if isinstance(self._tags_raw, list):
            return self._tags_raw
        try:
            return json.loads(self._tags_raw) if self._tags_raw else []
        except (json.JSONDecodeError, TypeError):
            return []

    @classmethod
    def from_row(cls, row: Any) -> "Project":
        # Support both dict (MySQL) and sqlite3.Row
        if hasattr(row, 'keys'):
            return cls(
                id=row["id"],
                title=row["title"],
                genre=row["genre"],
                tags=row["tags"],
                duration=row["duration"],
                status=row["status"],
                color=row["color"],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )
        return cls(*row)
