"""Project API: CRUD endpoints for projects."""
from typing import Optional

from fastapi import APIRouter, HTTPException

from server.project_store import (
    create_project,
    delete_project,
    get_project,
    list_projects,
    update_project,
)
from server.store import has_completed_generate_task
from server.schemas import (
    ProjectCreate,
    ProjectListResponse,
    ProjectResponse,
    ProjectUpdate,
)

router = APIRouter(prefix="/api/projects", tags=["projects"])


def _project_to_response(project) -> ProjectResponse:
    """Convert Project model to ProjectResponse. If status is Draft but project has a completed generate task, show Generated."""
    status = project.status
    if status == "Draft" and has_completed_generate_task(project.id):
        status = "Generated"
    return ProjectResponse(
        id=project.id,
        title=project.title,
        genre=project.genre,
        tags=project.tags,
        duration=project.duration,
        status=status,
        color=project.color,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )


@router.post("", response_model=ProjectResponse, status_code=201)
def post_create_project(body: ProjectCreate):
    """Create a new project."""
    project_id = create_project(
        title=body.title,
        genre=body.genre or "",
        tags=body.tags,
        status=body.status or "Draft",
        color=body.color or "bg-primary",
    )
    project = get_project(project_id)
    return _project_to_response(project)


@router.get("", response_model=ProjectListResponse)
def get_projects(
    page: int = 1,
    page_size: int = 20,
    status: Optional[str] = None,
    genre: Optional[str] = None,
    search: Optional[str] = None,
):
    """List projects with optional filtering."""
    items, total = list_projects(
        page=page,
        page_size=page_size,
        status=status,
        genre=genre,
        search=search,
    )
    return ProjectListResponse(
        items=[_project_to_response(p) for p in items],
        total=total,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_detail(project_id: str):
    """Get a single project by ID."""
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_to_response(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
def patch_project(project_id: str, body: ProjectUpdate):
    """Update a project."""
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    update_project(
        project_id,
        title=body.title,
        genre=body.genre,
        tags=body.tags,
        duration=body.duration,
        status=body.status,
        color=body.color,
    )
    
    project = get_project(project_id)
    return _project_to_response(project)


@router.delete("/{project_id}", status_code=204)
def remove_project(project_id: str):
    """Delete a project."""
    project = get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    delete_project(project_id)
    return None
