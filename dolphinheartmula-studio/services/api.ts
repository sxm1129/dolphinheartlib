import { Project, GenConfig } from '../types';

// API Base URL - configure via environment variable or default to local
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:10010/api';

// ==================== Project API ====================

export interface ProjectCreateRequest {
  title: string;
  genre?: string;
  tags?: string[];
  status?: string;
  color?: string;
}

export interface ProjectUpdateRequest {
  title?: string;
  genre?: string;
  tags?: string[];
  duration?: string;
  status?: string;
  color?: string;
}

export interface ProjectListResponse {
  items: Project[];
  total: number;
}

export const fetchProjects = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  genre?: string;
  status?: string;
}): Promise<ProjectListResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.page_size) searchParams.set('page_size', String(params.page_size));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.genre) searchParams.set('genre', params.genre);
  if (params?.status) searchParams.set('status', params.status);
  
  const query = searchParams.toString();
  const url = `${API_BASE}/projects${query ? `?${query}` : ''}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }
  return response.json();
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(`${API_BASE}/projects/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to get project: ${response.statusText}`);
  }
  return response.json();
};

export const createProject = async (data: ProjectCreateRequest): Promise<Project> => {
  const response = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.statusText}`);
  }
  return response.json();
};

export const updateProject = async (id: string, data: ProjectUpdateRequest): Promise<Project> => {
  const response = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update project: ${response.statusText}`);
  }
  return response.json();
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.statusText}`);
  }
};

// ==================== Task API ====================

export interface TaskResponse {
  id: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  params: Record<string, unknown>;
  output_audio_path: string | null;
  result: unknown;
  error_message: string | null;
}

export interface GeneratePayload {
  lyrics: string;
  tags: string;
  max_audio_length_ms?: number;
  topk?: number;
  temperature?: number;
  cfg_scale?: number;
  version?: string;
}

export const generateAudio = async (payload: GeneratePayload): Promise<{ task_id: string }> => {
  const response = await fetch(`${API_BASE}/tasks/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to create generate task: ${response.statusText}`);
  }
  return response.json();
};

export const getTask = async (taskId: string): Promise<TaskResponse> => {
  const response = await fetch(`${API_BASE}/tasks/${taskId}`);
  if (!response.ok) {
    throw new Error(`Failed to get task: ${response.statusText}`);
  }
  return response.json();
};

export const getAudioUrl = (taskId: string): string => {
  return `${API_BASE}/tasks/${taskId}/audio`;
};

// Poll task status until completed or failed
export const pollTaskStatus = async (
  taskId: string,
  onStatusChange?: (task: TaskResponse) => void,
  maxAttempts = 120,
  intervalMs = 2000
): Promise<TaskResponse> => {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const task = await getTask(taskId);
    onStatusChange?.(task);
    
    if (task.status === 'completed' || task.status === 'failed') {
      return task;
    }
    
    await new Promise(resolve => setTimeout(resolve, intervalMs));
    attempts++;
  }
  
  throw new Error(`Task ${taskId} did not complete within ${maxAttempts * intervalMs / 1000} seconds`);
};

// ==================== Model API ====================

export const getModelList = async (): Promise<string[]> => {
  // TODO: Implement actual model list API when available
  return [
    'HeartMula-Pro-4B (v2.1)',
    'HeartMula-Fast-2B',
    'HeartCodec-Studio-HQ',
    'HeartMula-3B (Standard)'
  ];
};

// ==================== File Upload API ====================

export interface UploadResponse {
  file_id: string;
  filename: string;
  path: string;
  size: number;
  content_type: string;
}

export const uploadReferenceAudio = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/uploads/audio`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to upload file: ${response.statusText}`);
  }
  
  return response.json();
};

export const deleteUploadedFile = async (fileId: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/uploads/${fileId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete file: ${response.statusText}`);
  }
};