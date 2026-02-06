"""Request/response Pydantic models for API."""
from typing import Any, List, Optional

from pydantic import BaseModel, Field


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
