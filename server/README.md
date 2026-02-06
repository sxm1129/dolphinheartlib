# HeartLib Frontend Server

HTTP API and task queue for music generation and lyrics transcription.

## Prerequisites

- Conda environment `heartlib_env` with heartlib installed (`pip install -e .` from repo root)
- Checkpoints under `./ckpt` (HeartMuLa, HeartCodec, and optionally HeartTranscriptor)

## Install server dependencies

From repo root:

```bash
conda activate heartlib_env
pip install -r server/requirements.txt
```

## Configuration (optional)

Environment variables:

- `HEARTLIB_MODEL_PATH`: path to checkpoints (default: `./ckpt`)
- `HEARTLIB_OUTPUT_DIR`: directory for task outputs and DB (default: `./output`)
- `HEARTLIB_CONCURRENCY`: number of concurrent workers (default: `2`)
- `HEARTLIB_HEARTMULA_VERSION`: model version, e.g. `3B` (default: `3B`)

## Run the server

From repo root:

```bash
conda activate heartlib_env
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

API will be at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.
