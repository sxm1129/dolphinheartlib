"""Task API: POST/GET/PATCH tasks."""
import json
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from server.config import OUTPUT_DIR
from server.schemas import (
    GenerateRequest,
    TaskCreateResponse,
    TaskListResponse,
    TaskPatchRequest,
    TaskResponse,
)
from server.store import create_task, create_task_with_id, get_task, list_tasks, update_task
from server.queue import enqueue

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

# Max upload size 100MB
MAX_UPLOAD_BYTES = 100 * 1024 * 1024


def _task_to_response(task) -> TaskResponse:
    params = task.params
    if isinstance(params, str):
        try:
            params = json.loads(params)
        except Exception:
            params = {}
    result = task.result
    if isinstance(result, str):
        try:
            result = json.loads(result)
        except Exception:
            result = None
    return TaskResponse(
        id=task.id,
        type=task.type,
        status=task.status,
        created_at=task.created_at,
        updated_at=task.updated_at,
        params=params,
        output_audio_path=task.output_audio_path,
        result=result,
        error_message=task.error_message,
    )


@router.post("/generate", response_model=TaskCreateResponse, status_code=201)
def post_generate(body: GenerateRequest):
    params = {
        "lyrics": body.lyrics,
        "tags": body.tags,
        "max_audio_length_ms": body.max_audio_length_ms,
        "topk": body.topk,
        "temperature": body.temperature,
        "cfg_scale": body.cfg_scale,
        "version": body.version,
    }
    task_id = create_task("generate", params)
    enqueue(task_id)
    return TaskCreateResponse(task_id=task_id)


@router.post("/transcribe", response_model=TaskCreateResponse, status_code=201)
async def post_transcribe(
    file: UploadFile = File(...),
    max_new_tokens: Optional[int] = Form(256),
    num_beams: Optional[int] = Form(2),
    task: Optional[str] = Form("transcribe"),
    condition_on_prev_tokens: Optional[bool] = Form(False),
    compression_ratio_threshold: Optional[float] = Form(1.8),
    logprob_threshold: Optional[float] = Form(-1.0),
    no_speech_threshold: Optional[float] = Form(0.4),
):
    content = await file.read()
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large")
    ext = Path(file.filename or "audio").suffix or ".mp3"
    if ext.lower() not in (".mp3", ".wav", ".ogg", ".flac", ".m4a", ".webm"):
        ext = ".mp3"
    task_id = str(uuid.uuid4())
    out_dir = Path(OUTPUT_DIR) / task_id
    out_dir.mkdir(parents=True, exist_ok=True)
    upload_name = f"upload_audio{ext}"
    audio_path = str(out_dir / upload_name)
    with open(audio_path, "wb") as f:
        f.write(content)
    rel_audio = f"{task_id}/{upload_name}"
    params = {
        "audio_path": audio_path,
        "max_new_tokens": max_new_tokens,
        "num_beams": num_beams,
        "task": task,
        "condition_on_prev_tokens": condition_on_prev_tokens,
        "compression_ratio_threshold": compression_ratio_threshold,
        "temperature": (0.0, 0.1, 0.2, 0.4),
        "logprob_threshold": logprob_threshold,
        "no_speech_threshold": no_speech_threshold,
    }
    create_task_with_id(task_id, "transcribe", params)
    update_task(task_id, output_audio_path=rel_audio)
    enqueue(task_id)
    return TaskCreateResponse(task_id=task_id)


@router.get("", response_model=TaskListResponse)
def get_tasks(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    type: Optional[str] = None,
):
    items, total = list_tasks(page=page, page_size=page_size, status=status, task_type=type)
    return TaskListResponse(
        items=[_task_to_response(t) for t in items],
        total=total,
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task_detail(task_id: str):
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return _task_to_response(task)


@router.patch("/{task_id}", response_model=TaskResponse)
def patch_task(task_id: str, body: TaskPatchRequest):
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if body.result is not None:
        update_task(task_id, result=body.result)
    task = get_task(task_id)
    return _task_to_response(task)
