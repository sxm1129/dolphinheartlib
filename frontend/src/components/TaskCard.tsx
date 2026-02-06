import { Link } from 'react-router-dom'
import type { Task } from '../api'
import AudioPlayer from './AudioPlayer'

interface TaskCardProps {
  task: Task
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  running: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
}

export default function TaskCard({ task }: TaskCardProps) {
  const statusClass = statusColors[task.status] ?? 'bg-gray-100 text-gray-800'
  const hasAudio = Boolean(task.output_audio_path)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-mono text-sm text-gray-500">{task.id.slice(0, 8)}</span>
        <span className="text-sm font-medium text-gray-700">{task.type}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass}`}>
          {task.status}
        </span>
        <span className="text-sm text-gray-500">
          {new Date(task.created_at).toLocaleString()}
        </span>
      </div>
      <div className="mt-2 flex gap-2">
        <Link
          to={`/tasks/${task.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          详情
        </Link>
        {hasAudio && (
          <span className="text-sm text-gray-500">可试听</span>
        )}
      </div>
      {hasAudio && (
        <div className="mt-2">
          <AudioPlayer taskId={task.id} />
        </div>
      )}
    </div>
  )
}
