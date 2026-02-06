"""SQLite connection and table initialization."""
import sqlite3
from pathlib import Path

from server.config import OUTPUT_DIR, ensure_output_dir

DB_PATH = str(Path(OUTPUT_DIR) / "heartlib.db")

CREATE_TASKS_TABLE = """
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    params TEXT NOT NULL,
    output_audio_path TEXT,
    result TEXT,
    error_message TEXT
)
"""


def get_connection() -> sqlite3.Connection:
    """Return a connection to the SQLite database."""
    ensure_output_dir()
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tasks table if it does not exist."""
    ensure_output_dir()
    with get_connection() as conn:
        conn.execute(CREATE_TASKS_TABLE)
        conn.commit()
