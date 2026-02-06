import { useEffect, useState } from 'react'
import { getTasks, type Task } from '../api'
import TaskCard from '../components/TaskCard'

export default function TaskList() {
  const [items, setItems] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('')
  const [type, setType] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pageSize = 20

  useEffect(() => {
    setLoading(true)
    setError(null)
    getTasks(page, pageSize, status || undefined, type || undefined)
      .then((res) => {
        setItems(res.items)
        setTotal(res.total)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, status, type])

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">任务列表 / 历史记录</h1>
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">全部状态</option>
          <option value="pending">pending</option>
          <option value="running">running</option>
          <option value="completed">completed</option>
          <option value="failed">failed</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
        >
          <option value="">全部类型</option>
          <option value="generate">generate</option>
          <option value="transcribe">transcribe</option>
        </select>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
          {items.length === 0 && (
            <p className="text-gray-500">暂无任务</p>
          )}
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 text-sm"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}（共 {total} 条）
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 text-sm"
            >
              下一页
            </button>
          </div>
        </>
      )}
    </div>
  )
}
