"""Pytest fixtures for server tests (test DB path, no-op enqueue)."""
import pytest


@pytest.fixture
def app_client(tmp_path, monkeypatch):
    """TestClient with SQLite in tmp_path and enqueue no-op (no worker run).
    Uses context manager so lifespan (init_db) runs before requests.
    """
    monkeypatch.setattr("server.config.USE_MYSQL", False)
    monkeypatch.setattr("server.config.OUTPUT_DIR", str(tmp_path))
    monkeypatch.setattr("server.db.SQLITE_DB_PATH", str(tmp_path / "heartlib.db"))
    monkeypatch.setattr("server.queue.enqueue", lambda _: None)

    from fastapi.testclient import TestClient
    from server.main import app

    with TestClient(app) as client:
        yield client
