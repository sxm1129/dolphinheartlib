"""File serving: task audio for playback."""
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from server.config import OUTPUT_DIR
from server.store import get_task

router = APIRouter(prefix="/api/tasks", tags=["files"])


@router.get("/{task_id}/audio")
def get_task_audio(task_id: str):
    task = get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    rel = task.output_audio_path
    if not rel:
        raise HTTPException(status_code=404, detail="No audio for this task")
    path = Path(OUTPUT_DIR) / rel
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Audio file not found")
    return FileResponse(path, media_type="audio/mpeg")
