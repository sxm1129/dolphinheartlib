"""Tests for GET /api/models: list available checkpoints, filter hidden dirs."""
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from server.routes.models import list_models, DEFAULT_MODELS, router
from fastapi import FastAPI

# Minimal app that only mounts models router (no DB/queue startup)
app = FastAPI()
app.include_router(router)
client = TestClient(app)


def test_list_models_filters_hidden_dirs(tmp_path: Path, monkeypatch):
    """Subdirs starting with '.' must not appear in response."""
    monkeypatch.setattr("server.routes.models._models_cache", None)
    (tmp_path / "HeartMuLa-oss-3B").mkdir()
    (tmp_path / "._____temp").mkdir()
    (tmp_path / "HeartCodec-oss").mkdir()
    monkeypatch.setattr("server.routes.models.MODEL_PATH", str(tmp_path))
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert "HeartMuLa-oss-3B" in data
    assert "HeartCodec-oss" in data
    assert "._____temp" not in data
    assert data == sorted(data)


def test_list_models_returns_default_when_path_not_dir(monkeypatch):
    """When MODEL_PATH is not a directory, return DEFAULT_MODELS."""
    monkeypatch.setattr("server.routes.models._models_cache", None)
    monkeypatch.setattr("server.routes.models.MODEL_PATH", "/nonexistent/path/12345")
    response = client.get("/api/models")
    assert response.status_code == 200
    assert response.json() == DEFAULT_MODELS


def test_list_models_returns_default_when_empty_dir(tmp_path: Path, monkeypatch):
    """When MODEL_PATH is an empty directory, return DEFAULT_MODELS."""
    monkeypatch.setattr("server.routes.models._models_cache", None)
    monkeypatch.setattr("server.routes.models.MODEL_PATH", str(tmp_path))
    response = client.get("/api/models")
    assert response.status_code == 200
    assert response.json() == DEFAULT_MODELS


def test_list_models_returns_only_visible_dirs_when_all_hidden(tmp_path: Path, monkeypatch):
    """When only hidden subdirs exist, return DEFAULT_MODELS (no visible names)."""
    monkeypatch.setattr("server.routes.models._models_cache", None)
    (tmp_path / ".hidden").mkdir()
    (tmp_path / ".another").mkdir()
    monkeypatch.setattr("server.routes.models.MODEL_PATH", str(tmp_path))
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert ".hidden" not in data
    assert ".another" not in data
    assert data == DEFAULT_MODELS
