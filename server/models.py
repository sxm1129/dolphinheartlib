"""Task model and enums aligned with DB schema."""
from enum import Enum
from typing import Any, Optional

TaskType = Enum("TaskType", ["generate", "transcribe"])
TaskStatus = Enum("TaskStatus", ["pending", "running", "completed", "failed"])


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
