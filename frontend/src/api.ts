const API_BASE = '/api'

export interface Task {
  id: string
  type: string
  status: string
  created_at: string
  updated_at: string
  params: Record<string, unknown>
  output_audio_path: string | null
  result: unknown
  error_message: string | null
}

export interface TaskListResponse {
  items: Task[]
  total: number
}

export interface GeneratePayload {
  lyrics: string
  tags: string
  max_audio_length_ms?: number
  topk?: number
  temperature?: number
  cfg_scale?: number
  version?: string
  /** Optional: associate task with a project (Studio-style). */
  project_id?: string | null
  /** Optional: reference audio file_id from POST /api/uploads/audio (Studio-style). */
  ref_file_id?: string | null
}

export interface TranscribeParams {
  max_new_tokens?: number
  num_beams?: number
  task?: string
  condition_on_prev_tokens?: boolean
  compression_ratio_threshold?: number
  logprob_threshold?: number
  no_speech_threshold?: number
}

export async function getTasks(
  page = 1,
  pageSize = 20,
  status?: string,
  type?: string,
  projectId?: string
): Promise<TaskListResponse> {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
  if (status) params.set('status', status)
  if (type) params.set('type', type)
  if (projectId) params.set('project_id', projectId)
  const r = await fetch(`${API_BASE}/tasks?${params}`)
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function getTask(id: string): Promise<Task> {
  const r = await fetch(`${API_BASE}/tasks/${id}`)
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function createGenerate(data: GeneratePayload): Promise<{ task_id: string }> {
  const body: Record<string, unknown> = {
    lyrics: data.lyrics,
    tags: data.tags,
    max_audio_length_ms: data.max_audio_length_ms,
    topk: data.topk,
    temperature: data.temperature,
    cfg_scale: data.cfg_scale,
    version: data.version,
  }
  if (data.project_id != null && data.project_id !== '') body.project_id = data.project_id
  if (data.ref_file_id != null && data.ref_file_id !== '') body.ref_file_id = data.ref_file_id
  const r = await fetch(`${API_BASE}/tasks/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function createTranscribe(
  file: File,
  params: TranscribeParams
): Promise<{ task_id: string }> {
  const form = new FormData()
  form.append('file', file)
  form.append('max_new_tokens', String(params.max_new_tokens ?? 256))
  form.append('num_beams', String(params.num_beams ?? 2))
  form.append('task', params.task ?? 'transcribe')
  form.append('condition_on_prev_tokens', String(params.condition_on_prev_tokens ?? false))
  form.append('compression_ratio_threshold', String(params.compression_ratio_threshold ?? 1.8))
  form.append('logprob_threshold', String(params.logprob_threshold ?? -1.0))
  form.append('no_speech_threshold', String(params.no_speech_threshold ?? 0.4))
  const r = await fetch(`${API_BASE}/tasks/transcribe`, {
    method: 'POST',
    body: form,
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function updateTask(id: string, body: { result?: unknown }): Promise<Task> {
  const r = await fetch(`${API_BASE}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export function getAudioUrl(taskId: string): string {
  return `${API_BASE}/tasks/${taskId}/audio`
}

const DEFAULT_MODELS = ['HeartMuLa-oss-3B', 'HeartMula-Pro-4B (v2.1)', 'HeartMula-Fast-2B']

export async function getModelList(): Promise<string[]> {
  try {
    const r = await fetch(`${API_BASE}/models`)
    if (!r.ok) return DEFAULT_MODELS
    const list = await r.json()
    return Array.isArray(list) && list.length > 0 ? list : DEFAULT_MODELS
  } catch {
    return DEFAULT_MODELS
  }
}
