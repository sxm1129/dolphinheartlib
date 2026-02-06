"""Server configuration from environment or defaults."""
import os
from pathlib import Path

# Root of the heartlib repo (parent of server/)
_REPO_ROOT = Path(__file__).resolve().parent.parent

MODEL_PATH = os.environ.get("HEARTLIB_MODEL_PATH", str(_REPO_ROOT / "ckpt"))
OUTPUT_DIR = os.environ.get("HEARTLIB_OUTPUT_DIR", str(_REPO_ROOT / "output"))
CONCURRENCY = int(os.environ.get("HEARTLIB_CONCURRENCY", "2"))
HEARTMULA_VERSION = os.environ.get("HEARTLIB_HEARTMULA_VERSION", "3B")


def ensure_output_dir() -> None:
    """Create OUTPUT_DIR if it does not exist."""
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
