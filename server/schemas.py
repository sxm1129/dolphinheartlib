"""Request/response Pydantic models for API."""
from typing import Any, List, Optional

from pydantic import BaseModel, Field


# ==================== Task Schemas ====================

class GenerateRequest(BaseModel):
    lyrics: str
    tags: str
    max_audio_length_ms: Optional[int] = 240_000
    topk: Optional[int] = 50
    temperature: Optional[float] = 1.0
    cfg_scale: Optional[float] = 1.5
    version: Optional[str] = "3B"


class TranscribeRequestParams(BaseModel):
    max_new_tokens: Optional[int] = 256
    num_beams: Optional[int] = 2
    task: Optional[str] = "transcribe"
    condition_on_prev_tokens: Optional[bool] = False
    compression_ratio_threshold: Optional[float] = 1.8
    logprob_threshold: Optional[float] = -1.0
    no_speech_threshold: Optional[float] = 0.4


class TaskCreateResponse(BaseModel):
    task_id: str


class TaskResponse(BaseModel):
    id: str
    type: str
    status: str
    created_at: str
    updated_at: str
    params: Any
    output_audio_path: Optional[str] = None
    result: Optional[Any] = None
    error_message: Optional[str] = None


class TaskListResponse(BaseModel):
    items: List[TaskResponse]
    total: int


class TaskPatchRequest(BaseModel):
    result: Optional[Any] = None


# ==================== Project Schemas ====================

class ProjectCreate(BaseModel):
    """Request body for creating a new project."""
    title: str
    genre: Optional[str] = ""
    tags: Optional[List[str]] = []
    status: Optional[str] = "Draft"
    color: Optional[str] = "bg-primary"


class ProjectUpdate(BaseModel):
    """Request body for updating a project."""
    title: Optional[str] = None
    genre: Optional[str] = None
    tags: Optional[List[str]] = None
    duration: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None


class ProjectResponse(BaseModel):
    """Response model for a single project."""
    id: str
    title: str
    genre: str
    tags: List[str]
    duration: str
    status: str
    color: str
    created_at: str
    updated_at: str


class ProjectListResponse(BaseModel):
    """Response model for project list."""
    items: List[ProjectResponse]
    total: int
