"""Server configuration from environment or defaults."""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file if present
load_dotenv()

# Root of the heartlib repo (parent of server/)
_REPO_ROOT = Path(__file__).resolve().parent.parent

# Model & Output Configuration
MODEL_PATH = os.environ.get("HEARTLIB_MODEL_PATH", str(_REPO_ROOT / "ckpt"))
OUTPUT_DIR = os.environ.get("HEARTLIB_OUTPUT_DIR", str(_REPO_ROOT / "output"))
CONCURRENCY = int(os.environ.get("HEARTLIB_CONCURRENCY", "2"))
HEARTMULA_VERSION = os.environ.get("HEARTLIB_HEARTMULA_VERSION", "3B")

# Database Configuration (MySQL or SQLite fallback)
DB_HOST = os.environ.get("DB_HOST", "")
DB_PORT = int(os.environ.get("DB_PORT", "3306"))
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "")
DB_NAME = os.environ.get("DB_NAME", "dolphinheartlib")

# Use MySQL if DB_HOST is set, otherwise SQLite
USE_MYSQL = bool(DB_HOST)


def ensure_output_dir() -> None:
    """Create OUTPUT_DIR if it does not exist."""
    Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
