"""FastAPI app entry: routes, CORS, DB and queue startup."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from server.db import init_db
from server.queue import start as queue_start
from server.routes import files, tasks, projects, uploads, models, shares, lyrics

app = FastAPI(title="HeartLib API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(files.router)
app.include_router(projects.router)
app.include_router(uploads.router)
app.include_router(models.router)
app.include_router(shares.router)
app.include_router(lyrics.router)


@app.on_event("startup")
def startup():
    init_db()
    queue_start()

