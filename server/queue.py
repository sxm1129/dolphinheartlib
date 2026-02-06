"""In-process task queue with two worker threads."""
import queue
import threading

from server.config import CONCURRENCY
from server import workers


_task_queue: queue.Queue = queue.Queue()
_workers: list[threading.Thread] = []


def _worker_loop() -> None:
    while True:
        try:
            task_id = _task_queue.get(timeout=1.0)
        except queue.Empty:
            continue
        if task_id is None:
            break
        from server.store import get_task

        task = get_task(task_id)
        if not task:
            continue
        if task.type == "generate":
            workers.run_generate_task(task_id)
        elif task.type == "transcribe":
            workers.run_transcribe_task(task_id)
        _task_queue.task_done()


def start() -> None:
    """Start CONCURRENCY worker threads."""
    global _workers
    for _ in range(CONCURRENCY):
        t = threading.Thread(target=_worker_loop, daemon=True)
        t.start()
        _workers.append(t)


def enqueue(task_id: str) -> None:
    """Add task_id to the queue."""
    _task_queue.put(task_id)
