"""MySQL/SQLite database connection and table initialization."""
import sqlite3
from pathlib import Path
from typing import Any, Optional
from contextlib import contextmanager

from server.config import (
    USE_MYSQL, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, 
    OUTPUT_DIR, ensure_output_dir
)

# SQLite path (fallback)
SQLITE_DB_PATH = str(Path(OUTPUT_DIR) / "heartlib.db")

# Table creation SQL (MySQL compatible)
CREATE_TASKS_TABLE_MYSQL = """
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at VARCHAR(50) NOT NULL,
    updated_at VARCHAR(50) NOT NULL,
    params TEXT NOT NULL,
    output_audio_path VARCHAR(500),
    result LONGTEXT,
    error_message TEXT,
    project_id VARCHAR(36) DEFAULT NULL,
    INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"""

CREATE_PROJECTS_TABLE_MYSQL = """
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    genre VARCHAR(100),
    tags TEXT,
    duration VARCHAR(50) DEFAULT '',
    status VARCHAR(50) DEFAULT 'Draft',
    color VARCHAR(50) DEFAULT 'bg-primary',
    created_at VARCHAR(50) NOT NULL,
    updated_at VARCHAR(50) NOT NULL,
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"""

# SQLite table creation
CREATE_TASKS_TABLE_SQLITE = """
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    params TEXT NOT NULL,
    output_audio_path TEXT,
    result TEXT,
    error_message TEXT,
    project_id TEXT
)
"""

CREATE_PROJECTS_TABLE_SQLITE = """
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    genre TEXT,
    tags TEXT,
    duration TEXT DEFAULT '',
    status TEXT DEFAULT 'Draft',
    color TEXT DEFAULT 'bg-primary',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
"""

# Shares table for public sharing links
CREATE_SHARES_TABLE_MYSQL = """
CREATE TABLE IF NOT EXISTS shares (
    id VARCHAR(36) PRIMARY KEY,
    task_id VARCHAR(36) NOT NULL,
    title VARCHAR(200),
    created_at VARCHAR(50) NOT NULL,
    expires_at VARCHAR(50),
    view_count INT DEFAULT 0,
    INDEX idx_task_id (task_id),
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"""

CREATE_SHARES_TABLE_SQLITE = """
CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    title TEXT,
    created_at TEXT NOT NULL,
    expires_at TEXT,
    view_count INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
)
"""

# Users table for simple login
CREATE_USERS_TABLE_MYSQL = """
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(128) NOT NULL,
    display_name VARCHAR(200) DEFAULT '',
    plan VARCHAR(50) DEFAULT 'Pro',
    created_at VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
"""

CREATE_USERS_TABLE_SQLITE = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    display_name TEXT DEFAULT '',
    plan TEXT DEFAULT 'Pro',
    created_at TEXT NOT NULL
)
"""


class MySQLConnection:
    """MySQL connection wrapper that mimics sqlite3.Connection interface."""
    
    def __init__(self, conn):
        self._conn = conn
        self._cursor = None
    
    def execute(self, sql: str, params: tuple = ()) -> Any:
        """Execute SQL and return cursor."""
        cursor = self._conn.cursor()
        # Convert SQLite-style ? placeholders to MySQL %s
        sql = sql.replace("?", "%s")
        cursor.execute(sql, params)
        return cursor
    
    def commit(self):
        self._conn.commit()
    
    def close(self):
        self._conn.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.commit()
        self.close()


def _get_mysql_connection(use_db: bool = True) -> MySQLConnection:
    """Create a MySQL connection."""
    import pymysql
    from pymysql.cursors import DictCursor
    
    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME if use_db else None,
        charset='utf8mb4',
        cursorclass=DictCursor,
        autocommit=False
    )
    return MySQLConnection(conn)


def _get_sqlite_connection() -> sqlite3.Connection:
    """Create a SQLite connection."""
    ensure_output_dir()
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_connection():
    """Return a database connection (MySQL or SQLite based on config)."""
    if USE_MYSQL:
        return _get_mysql_connection()
    return _get_sqlite_connection()


def _create_database_if_not_exists():
    """Create the MySQL database if it doesn't exist."""
    if not USE_MYSQL:
        return
    
    import pymysql
    
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            charset='utf8mb4',
        )
        with conn.cursor() as cursor:
            cursor.execute(
                f"CREATE DATABASE IF NOT EXISTS {DB_NAME} "
                "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
            )
        conn.commit()
        conn.close()
        print(f"Database '{DB_NAME}' ensured.")
    except Exception as e:
        print(f"Warning: Could not create database: {e}")


def _project_id_column_exists() -> bool:
    """Return True if tasks.project_id already exists (avoids duplicate ALTER)."""
    with get_connection() as conn:
        if USE_MYSQL:
            cur = conn.execute(
                "SELECT 1 FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'project_id' LIMIT 1"
            )
            row = cur.fetchone()
            return row is not None
        # SQLite: pragma table_info(tasks) returns (cid, name, type, notnull, default, pk)
        cur = conn.execute("PRAGMA table_info(tasks)")
        rows = cur.fetchall()
        for row in rows:
            name = row[1] if isinstance(row, (list, tuple)) else (row.get("name") if hasattr(row, "get") else None)
            if name == "project_id":
                return True
        return False


def _add_project_id_to_tasks() -> None:
    """Add project_id column to tasks if missing (migration for existing DBs)."""
    if _project_id_column_exists():
        return
    try:
        with get_connection() as conn:
            if USE_MYSQL:
                conn.execute(
                    "ALTER TABLE tasks ADD COLUMN project_id VARCHAR(36) DEFAULT NULL"
                )
            else:
                conn.execute("ALTER TABLE tasks ADD COLUMN project_id TEXT DEFAULT NULL")
            conn.commit()
        print("tasks.project_id column added.")
    except Exception as e:
        if "Duplicate column" in str(e) or "duplicate column" in str(e) or "already exists" in str(e).lower():
            pass
        else:
            print(f"Warning: Could not add project_id to tasks: {e}")





def _seed_admin_user() -> None:
    """Insert default admin user if no users exist. Username: admin, Password: Admin123!"""
    with get_connection() as conn:
        cur = conn.execute("SELECT 1 FROM users LIMIT 1")
        if cur.fetchone() is not None:
            return
        # Import bcrypt hash from auth utils
        from server.utils.auth import hash_password
        import uuid
        from datetime import datetime, timezone
        uid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        password_hash = hash_password("Admin123!")
        if USE_MYSQL:
            conn.execute(
                "INSERT INTO users (id, username, password_hash, display_name, plan, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
                (uid, "admin", password_hash, "Admin", "Pro", now),
            )
        else:
            conn.execute(
                "INSERT INTO users (id, username, password_hash, display_name, plan, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (uid, "admin", password_hash, "Admin", "Pro", now),
            )
        conn.commit()
        print("✅ Default admin user created (username: admin, password: Admin123!)")





def init_db() -> None:
    """Create tasks, projects, shares, and users tables if they do not exist."""
    if USE_MYSQL:
        _create_database_if_not_exists()
        with get_connection() as conn:
            conn.execute(CREATE_TASKS_TABLE_MYSQL)
            conn.execute(CREATE_PROJECTS_TABLE_MYSQL)
            conn.execute(CREATE_SHARES_TABLE_MYSQL)
            conn.execute(CREATE_USERS_TABLE_MYSQL)
            conn.commit()
        _add_project_id_to_tasks()
        _seed_admin_user()
        print("MySQL tables initialized.")
    else:
        ensure_output_dir()
        with get_connection() as conn:
            conn.execute(CREATE_TASKS_TABLE_SQLITE)
            conn.execute(CREATE_PROJECTS_TABLE_SQLITE)
            conn.execute(CREATE_SHARES_TABLE_SQLITE)
            conn.execute(CREATE_USERS_TABLE_SQLITE)
            conn.commit()
        _add_project_id_to_tasks()
        _seed_admin_user()
        print("SQLite tables initialized.")
