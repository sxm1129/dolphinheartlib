import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTask, updateTask, type Task } from '../api'
import AudioPlayer from '../components/AudioPlayer'

export default function TaskDetail() {
  const { taskId } = useParams<{ taskId: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!taskId) return
    setLoading(true)
    setError(null)
    getTask(taskId)
      .then((t) => {
        setTask(t)
        const text = typeof t.result === 'object' && t.result !== null && 'text' in t.result
          ? String((t.result as { text?: string }).text)
          : t.result != null
            ? String(t.result)
            : ''
        setEditText(text)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [taskId])

  const handleSaveResult = () => {
    if (!taskId || task?.type !== 'transcribe') return
    setSaving(true)
    updateTask(taskId, { result: { text: editText } })
      .then((t) => {
        setTask(t)
        setEditText(
          typeof t.result === 'object' && t.result !== null && 'text' in t.result
            ? String((t.result as { text?: string }).text)
            : ''
        )
      })
      .catch((e) => setError(e.message))
      .finally(() => setSaving(false))
  }

  if (!taskId) return null
  if (loading) return <p className="text-gray-500">加载中...</p>
  if (error || !task) {
    return (
      <div>
        <p className="text-red-600">{error || '任务不存在'}</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-2 text-blue-600 hover:underline"
        >
          返回列表
        </button>
      </div>
    )
  }

  const hasAudio = Boolean(task.output_audio_path)
  const resultText =
    typeof task.result === 'object' && task.result !== null && 'text' in task.result
      ? (task.result as { text?: string }).text
      : task.result != null
        ? String(task.result)
        : ''

  return (
    <div>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="text-sm text-blue-600 hover:underline mb-4"
      >
        返回列表
      </button>
      <h1 className="text-xl font-semibold text-gray-800 mb-2">任务详情</h1>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm mb-4">
        <dt className="text-gray-500">ID</dt>
        <dd className="font-mono">{task.id}</dd>
        <dt className="text-gray-500">类型</dt>
        <dd>{task.type}</dd>
        <dt className="text-gray-500">状态</dt>
        <dd>{task.status}</dd>
        <dt className="text-gray-500">创建时间</dt>
        <dd>{new Date(task.created_at).toLocaleString()}</dd>
        <dt className="text-gray-500">更新时间</dt>
        <dd>{new Date(task.updated_at).toLocaleString()}</dd>
      </dl>
      {task.error_message && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {task.error_message}
        </div>
      )}
      {hasAudio && (
        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-2">试听</h2>
          <AudioPlayer taskId={task.id} />
        </div>
      )}
      {task.type === 'transcribe' && (
        <div className="mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-2">转写结果（可编辑）</h2>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full border border-gray-300 rounded p-2 min-h-[120px] text-sm"
            placeholder="转写文本"
          />
          <button
            type="button"
            onClick={handleSaveResult}
            disabled={saving}
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      )}
      <div className="mt-4">
        <h2 className="text-sm font-medium text-gray-700 mb-1">参数</h2>
        <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-48">
          {JSON.stringify(task.params, null, 2)}
        </pre>
      </div>
    </div>
  )
}
