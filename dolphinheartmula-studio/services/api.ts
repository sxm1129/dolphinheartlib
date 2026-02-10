import { Project } from '../types';

// API Base URL - configure via environment variable or default to local (strip trailing slash to avoid double slashes).
// When built without VITE_API_BASE: same-origin /api when not on localhost (nginx proxies /api to backend); else host:10001/api for local dev.
function getApiBase(): string {
  const envBase = import.meta.env.VITE_API_BASE;
  if (envBase) return envBase.replace(/\/+$/, '');
  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { protocol, hostname } = window.location;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (!isLocal) return `${protocol}//${hostname}/api`;
    return `${protocol}//${hostname}:10001/api`;
  }
  return 'http://localhost:10001/api';
}
export const API_BASE = getApiBase();

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

export interface GpuInfo {
  available: boolean;
  device_name?: string;
  total_gb?: number;
  used_gb?: number;
  allocated_gb?: number;
  message?: string;
}

export const getGpuInfo = async (): Promise<GpuInfo> => {
  try {
    const response = await fetch(`${API_BASE}/models/gpu`);
    if (!response.ok) return { available: false, message: 'API Error' };
    return await response.json();
  } catch {
    return { available: false, message: 'Network Error' };
  }
};


export interface LyricsGenerateRequest {
  language: string;
  genre: string;
  mood: string;
  topic?: string;
}

export const generateLyrics = async (params: LyricsGenerateRequest): Promise<{ lyrics: string }> => {
  const response = await fetch(`${API_BASE}/lyrics/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to generate lyrics: ${response.status} ${errorBody}`);
  }
  return response.json();
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

// ==================== Share API ====================

export interface ShareCreateRequest {
  task_id: string;
  title?: string;
}

export interface ShareResponse {
  id: string;
  task_id: string;
  title?: string;
  created_at: string;
  view_count: number;
}

export interface ShareDetailResponse extends ShareResponse {
  task?: {
    id: string;
    status: string;
    output_audio_path?: string;
    params?: {
      lyrics?: string;
      tags?: string;
      max_audio_length_ms?: number;
    };
    created_at: string;
  };
}

export const createShare = async (taskId: string, title?: string): Promise<ShareResponse> => {
  const response = await fetch(`${API_BASE}/shares`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ task_id: taskId, title }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || `Failed to create share: ${response.statusText}`);
  }
  return response.json();
};

export const getShare = async (shareId: string): Promise<ShareDetailResponse> => {
  const response = await fetch(`${API_BASE}/shares/${shareId}`);
  if (!response.ok) {
    throw new Error(`Failed to get share: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

export const getShareAudioUrl = (taskId: string): string => {
  return `${API_BASE}/tasks/${taskId}/audio`;
};

// ==================== Auth API ====================

const AUTH_TOKEN_KEY = 'heartlib_auth_token';

export const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setStoredToken = (token: string | null): void => {
  try {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {}
};

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  plan: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Login failed');
  }
  return response.json();
};

export const getMe = async (): Promise<{ user: AuthUser }> => {
  const token = getStoredToken();
  if (!token) throw new Error('Not authenticated');
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    setStoredToken(null);
    throw new Error('Session expired');
  }
  return response.json();
};

export const logoutApi = async (): Promise<void> => {
  const token = getStoredToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  }
  setStoredToken(null);
};