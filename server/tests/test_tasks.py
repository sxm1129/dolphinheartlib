"""Tests for POST /api/tasks/generate and GET /api/tasks (project_id, version, ref_file_id)."""
import pytest
from fastapi.testclient import TestClient


def test_post_generate_accepts_project_id_version_ref_file_id(app_client: TestClient):
    """POST /api/tasks/generate stores project_id, version, ref_file_id in task params."""
    body = {
        "lyrics": "Hello world",
        "tags": "test",
        "max_audio_length_ms": 10000,
        "version": "HeartMula-Pro-4B (v2.1)",
        "project_id": "proj-123",
        "ref_file_id": "file-456",
    }
    r = app_client.post("/api/tasks/generate", json=body)
    assert r.status_code == 201
    data = r.json()
    assert "task_id" in data
    task_id = data["task_id"]

    r2 = app_client.get(f"/api/tasks/{task_id}")
    assert r2.status_code == 200
    task = r2.json()
    assert task["project_id"] == "proj-123"
    assert task["params"].get("version") == "HeartMula-Pro-4B (v2.1)"
    assert task["params"].get("ref_file_id") == "file-456"
    assert task["params"].get("lyrics") == "Hello world"


def test_list_tasks_filters_by_project_id(app_client: TestClient):
    """GET /api/tasks?project_id=X returns only tasks for that project."""
    body = {
        "lyrics": "A",
        "tags": "",
        "project_id": "filter-proj",
    }
    r = app_client.post("/api/tasks/generate", json=body)
    assert r.status_code == 201
    task_id = r.json()["task_id"]

    r2 = app_client.get("/api/tasks", params={"project_id": "filter-proj", "page": 1, "page_size": 10})
    assert r2.status_code == 200
    data = r2.json()
    assert data["total"] >= 1
    items = [t for t in data["items"] if t["id"] == task_id]
    assert len(items) == 1
    assert items[0]["project_id"] == "filter-proj"

    r3 = app_client.get("/api/tasks", params={"project_id": "other-proj", "page": 1, "page_size": 10})
    ids = [t["id"] for t in r3.json()["items"]]
    assert task_id not in ids
