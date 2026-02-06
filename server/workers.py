"""Background task execution: run_generate_task and run_transcribe_task."""
import json
import os
from pathlib import Path

import torch

from server.config import HEARTMULA_VERSION, MODEL_PATH, OUTPUT_DIR
from server.store import (
    STATUS_COMPLETED,
    STATUS_FAILED,
    get_task,
    update_task,
)


def _task_dir(task_id: str) -> Path:
    return Path(OUTPUT_DIR) / task_id


def run_generate_task(task_id: str) -> None:
    """Load HeartMuLaGenPipeline, run with task params, save audio to output/{task_id}/audio.mp3."""
    task = get_task(task_id)
    if not task or task.status != "pending":
        return
    update_task(task_id, status="running")
    out_dir = _task_dir(task_id)
    out_dir.mkdir(parents=True, exist_ok=True)
    save_path = str(out_dir / "audio.mp3")
    params = task.params if isinstance(task.params, dict) else json.loads(task.params)
    try:
        from heartlib import HeartMuLaGenPipeline

        pipe = HeartMuLaGenPipeline.from_pretrained(
            MODEL_PATH,
            device={"mula": torch.device("cuda"), "codec": torch.device("cuda")},
            dtype={"mula": torch.bfloat16, "codec": torch.float32},
            version=params.get("version", HEARTMULA_VERSION),
            lazy_load=True,
        )
        with torch.no_grad():
            pipe(
                {"lyrics": params["lyrics"], "tags": params["tags"]},
                max_audio_length_ms=params.get("max_audio_length_ms", 240_000),
                save_path=save_path,
                topk=params.get("topk", 50),
                temperature=params.get("temperature", 1.0),
                cfg_scale=params.get("cfg_scale", 1.5),
            )
        rel_path = f"{task_id}/audio.mp3"
        update_task(task_id, status=STATUS_COMPLETED, output_audio_path=rel_path)
    except Exception as e:
        update_task(
            task_id,
            status=STATUS_FAILED,
            error_message=str(e),
        )


def run_transcribe_task(task_id: str) -> None:
    """Load HeartTranscriptorPipeline, run on task audio, save result to output/{task_id}/transcription.json."""
    task = get_task(task_id)
    if not task or task.status != "pending":
        return
    update_task(task_id, status="running")
    out_dir = _task_dir(task_id)
    params = task.params if isinstance(task.params, dict) else json.loads(task.params)
    audio_path = params.get("audio_path")
    if not audio_path or not os.path.isfile(audio_path):
        update_task(
            task_id,
            status=STATUS_FAILED,
            error_message="Missing or invalid audio_path",
        )
        return
    out_dir.mkdir(parents=True, exist_ok=True)
    result_path = out_dir / "transcription.json"
    transcribe_kwargs = {
        "max_new_tokens": params.get("max_new_tokens", 256),
        "num_beams": params.get("num_beams", 2),
        "task": params.get("task", "transcribe"),
        "condition_on_prev_tokens": params.get("condition_on_prev_tokens", False),
        "compression_ratio_threshold": params.get("compression_ratio_threshold", 1.8),
        "temperature": params.get("temperature", (0.0, 0.1, 0.2, 0.4)),
        "logprob_threshold": params.get("logprob_threshold", -1.0),
        "no_speech_threshold": params.get("no_speech_threshold", 0.4),
    }
    if isinstance(transcribe_kwargs["temperature"], (list, tuple)):
        pass
    else:
        transcribe_kwargs["temperature"] = (
            transcribe_kwargs["temperature"],
            0.1,
            0.2,
            0.4,
        )
    try:
        from heartlib import HeartTranscriptorPipeline

        pipe = HeartTranscriptorPipeline.from_pretrained(
            MODEL_PATH,
            device=torch.device("cuda"),
            dtype=torch.float16,
        )
        with torch.no_grad():
            result = pipe(audio_path, **transcribe_kwargs)
        if not isinstance(result, dict):
            result = {"text": str(result)} if result is not None else {}
        if isinstance(result, list) and len(result) > 0:
            result = result[0] if isinstance(result[0], dict) else {"text": str(result)}
        with open(result_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        with open(result_path, "r", encoding="utf-8") as f:
            result_data = json.load(f)
        update_task(task_id, status=STATUS_COMPLETED, result=result_data)
    except Exception as e:
        update_task(
            task_id,
            status=STATUS_FAILED,
            error_message=str(e),
        )
