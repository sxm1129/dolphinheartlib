import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTranscribe, type TranscribeParams } from '../api'

export default function SubmitTranscribe() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [max_new_tokens, setMaxNewTokens] = useState(256)
  const [num_beams, setNumBeams] = useState(2)
  const [task, setTask] = useState('transcribe')
  const [condition_on_prev_tokens, setConditionOnPrevTokens] = useState(false)
  const [compression_ratio_threshold, setCompressionRatioThreshold] = useState(1.8)
  const [logprob_threshold, setLogprobThreshold] = useState(-1.0)
  const [no_speech_threshold, setNoSpeechThreshold] = useState(0.4)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('请选择音频文件')
      return
    }
    setError(null)
    setLoading(true)
    const params: TranscribeParams = {
      max_new_tokens,
      num_beams,
      task,
      condition_on_prev_tokens,
      compression_ratio_threshold,
      logprob_threshold,
      no_speech_threshold,
    }
    createTranscribe(file, params)
      .then(({ task_id }) => navigate(`/tasks/${task_id}`))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">歌词转录</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">音频文件 *</label>
          <input
            type="file"
            accept=".mp3,.wav,.ogg,.flac,.m4a,.webm,audio/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full border border-gray-300 rounded p-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">max_new_tokens</label>
            <input
              type="number"
              value={max_new_tokens}
              onChange={(e) => setMaxNewTokens(Number(e.target.value))}
              className="w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">num_beams</label>
            <input
              type="number"
              value={num_beams}
              onChange={(e) => setNumBeams(Number(e.target.value))}
              className="w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">task</label>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">condition_on_prev_tokens</label>
            <select
              value={String(condition_on_prev_tokens)}
              onChange={(e) => setConditionOnPrevTokens(e.target.value === 'true')}
              className="w-full border border-gray-300 rounded p-2 text-sm"
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">compression_ratio_threshold</label>
            <input
              type="number"
              step="0.1"
              value={compression_ratio_threshold}
              onChange={(e) => setCompressionRatioThreshold(Number(e.target.value))}
              className="w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">logprob_threshold</label>
            <input
              type="number"
              step="0.1"
              value={logprob_threshold}
              onChange={(e) => setLogprobThreshold(Number(e.target.value))}
              className="w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">no_speech_threshold</label>
            <input
              type="number"
              step="0.1"
              value={no_speech_threshold}
              onChange={(e) => setNoSpeechThreshold(Number(e.target.value))}
              className="w-full border border-gray-300 rounded p-2 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !file}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50"
        >
          {loading ? '提交中...' : '提交任务'}
        </button>
      </form>
    </div>
  )
}
