"""Model list API: return available checkpoints for frontend."""
import time
from pathlib import Path

from fastapi import APIRouter

from server.config import MODEL_PATH

router = APIRouter(prefix="/api/models", tags=["models"])

# Default display names when no dirs found
DEFAULT_MODELS = [
    "HeartMula-Pro-4B (v2.1)",
    "HeartMula-Fast-2B",
    "HeartCodec-Studio-HQ",
    "HeartMula-3B (Standard)",
]

# In-memory cache: (result_list, timestamp); TTL 60s
_models_cache: tuple[list[str], float] | None = None
_MODELS_CACHE_TTL = 60.0


@router.get("")
def list_models() -> list[str]:
    """Return list of available model/checkpoint names for generation.
    Reads subdirs of MODEL_PATH; falls back to default list if dir missing or empty.
    Results are cached for 60s to avoid repeated filesystem scans.
    """
    global _models_cache
    now = time.monotonic()
    if _models_cache is not None and (now - _models_cache[1]) < _MODELS_CACHE_TTL:
        return _models_cache[0]
    path = Path(MODEL_PATH)
    if not path.is_dir():
        _models_cache = (DEFAULT_MODELS, now)
        return DEFAULT_MODELS
    names = [d.name for d in path.iterdir() if d.is_dir() and not d.name.startswith(".")]
    if not names:
        _models_cache = (DEFAULT_MODELS, now)
        return DEFAULT_MODELS
    result = sorted(names)
    _models_cache = (result, now)
    return result
