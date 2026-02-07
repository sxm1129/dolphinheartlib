"""File upload API for reference audio."""
import os
import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from server.config import OUTPUT_DIR

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

# Upload directory
UPLOAD_DIR = Path(OUTPUT_DIR) / "uploads"
ALLOWED_EXTENSIONS = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


class UploadResponse(BaseModel):
    file_id: str
    filename: str
    path: str
    size: int
    content_type: str


def ensure_upload_dir():
    """Create upload directory if not exists."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/audio", response_model=UploadResponse)
async def upload_audio(file: UploadFile = File(...)):
    """Upload a reference audio file.
    
    Accepts MP3, WAV, FLAC, OGG, M4A, AAC formats.
    Max file size: 50MB.
    """
    ensure_upload_dir()
    
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file and check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Generate unique file ID
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}{ext}"
    file_path = UPLOAD_DIR / safe_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    return UploadResponse(
        file_id=file_id,
        filename=file.filename,
        path=str(file_path),
        size=len(content),
        content_type=file.content_type or "audio/mpeg"
    )


@router.get("/{file_id}")
async def get_upload_info(file_id: str):
    """Get information about an uploaded file."""
    for ext in ALLOWED_EXTENSIONS:
        file_path = UPLOAD_DIR / f"{file_id}{ext}"
        if file_path.exists():
            stat = file_path.stat()
            return {
                "file_id": file_id,
                "path": str(file_path),
                "size": stat.st_size,
                "exists": True
            }
    raise HTTPException(status_code=404, detail="File not found")


@router.delete("/{file_id}")
async def delete_upload(file_id: str):
    """Delete an uploaded file."""
    for ext in ALLOWED_EXTENSIONS:
        file_path = UPLOAD_DIR / f"{file_id}{ext}"
        if file_path.exists():
            file_path.unlink()
            return {"deleted": True, "file_id": file_id}
    raise HTTPException(status_code=404, detail="File not found")
