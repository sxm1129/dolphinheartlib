import { Project } from '../types';

// API Base URL - configure via environment variable or default to local (strip trailing slash to avoid double slashes)
const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:10001/api').replace(/\/+$/, '');

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
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.page_size != null) searchParams.set('page_size', String(params.page_size));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.genre) searchParams.set('genre', params.genre);
  if (params?.status) searchParams.set('status', params.status);
  
  const query = searchParams.toString();
  const url = `${API_BASE}/projects${query ? `?${query}` : ''}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const getProject = async (id: string): Promise<Project> => {
  const response = await fetch(`${API_BASE}/projects/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to get project: ${response.status} ${response.statusText}`);
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
    throw new Error(`Failed to create project: ${response.status} ${response.statusText}`);
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
    throw new Error(`Failed to update project: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const deleteProject = async (id: string): Promise<void> => {
  const response = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.status} ${response.statusText}`);
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
  project_id?: string | null;
}

export interface GeneratePayload {
  lyrics: string;
  tags: string;
  max_audio_length_ms?: number;
  topk?: number;
  temperature?: number;
  cfg_scale?: number;
  version?: string;
  project_id?: string | null;
  ref_file_id?: string | null;
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

export interface TaskListResponse {
  items: TaskResponse[];
  total: number;
}

export const getTasks = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  type?: string;
  project_id?: string;
}): Promise<TaskListResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.set('page', String(params.page));
  if (params?.page_size != null) searchParams.set('page_size', String(params.page_size));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.type) searchParams.set('type', params.type);
  if (params?.project_id) searchParams.set('project_id', params.project_id);
  const query = searchParams.toString();
  const response = await fetch(`${API_BASE}/tasks${query ? `?${query}` : ''}`);
  if (!response.ok) throw new Error(`Failed to fetch tasks: ${response.statusText}`);
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

export const updateTask = async (taskId: string, body: { result?: unknown }): Promise<TaskResponse> => {
  const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Failed to update task: ${response.statusText}`);
  return response.json();
};

// ==================== Transcribe API ====================

export interface TranscribeParams {
  max_new_tokens?: number;
  num_beams?: number;
  task?: string;
  condition_on_prev_tokens?: boolean;
  compression_ratio_threshold?: number;
  logprob_threshold?: number;
  no_speech_threshold?: number;
}

export const createTranscribe = async (
  file: File,
  params: TranscribeParams
): Promise<{ task_id: string }> => {
  const form = new FormData();
  form.append('file', file);
  form.append('max_new_tokens', String(params.max_new_tokens ?? 256));
  form.append('num_beams', String(params.num_beams ?? 2));
  form.append('task', params.task ?? 'transcribe');
  form.append('condition_on_prev_tokens', String(params.condition_on_prev_tokens ?? false));
  form.append('compression_ratio_threshold', String(params.compression_ratio_threshold ?? 1.8));
  form.append('logprob_threshold', String(params.logprob_threshold ?? -1.0));
  form.append('no_speech_threshold', String(params.no_speech_threshold ?? 0.4));
  const response = await fetch(`${API_BASE}/tasks/transcribe`, {
    method: 'POST',
    body: form,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Transcribe failed: ${response.statusText}`);
  }
  return response.json();
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

const DEFAULT_MODELS = [
  'HeartMula-Pro-4B (v2.1)',
  'HeartMula-Fast-2B',
  'HeartCodec-Studio-HQ',
  'HeartMula-3B (Standard)',
];

export const getModelList = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${API_BASE}/models`);
    if (!response.ok) return DEFAULT_MODELS;
    const list = await response.json();
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_MODELS;
  } catch {
    return DEFAULT_MODELS;
  }
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