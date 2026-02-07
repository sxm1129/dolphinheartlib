import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { createGenerate, getModelList, type GeneratePayload } from '../api'

export default function SubmitGenerate() {
  const navigate = useNavigate()
  const [lyrics, setLyrics] = useState('')
  const [tags, setTags] = useState('')
  const [max_audio_length_ms, setMaxAudioLengthMs] = useState(240_000)
  const [topk, setTopk] = useState(50)
  const [temperature, setTemperature] = useState(1.0)
  const [cfg_scale, setCfgScale] = useState(1.5)
  const [modelList, setModelList] = useState<string[]>([])
  const [version, setVersion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getModelList().then((list) => {
      setModelList(list)
      if (list.length > 0) {
        const first = list.filter((m) => m.toLowerCase().includes('heartmula'))[0] ?? list[0]
        setVersion((v) => (v ? v : first))
      }
    })
  }, [])

  const heartMulaOnly = modelList.filter((m) => m.toLowerCase().includes('heartmula'))
  const versionOptions = heartMulaOnly.length > 0 ? heartMulaOnly : modelList.length > 0 ? modelList : ['HeartMuLa-oss-3B', '3B']
  const effectiveVersion = version || versionOptions[0]

  const appendTag = (s: string) => {
    const trimmed = s.trim()
    if (!trimmed) return
    setTags((prev) => (prev ? `${prev},${trimmed}` : trimmed))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const payload: GeneratePayload = {
      lyrics,
      tags,
      max_audio_length_ms,
      topk,
      temperature,
      cfg_scale,
      version: effectiveVersion,
    }
    createGenerate(payload)
      .then(({ task_id }) => navigate(`/tasks/${task_id}`))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-800 mb-4">生成音乐</h1>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">歌词 *</label>
          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            required
            className="w-full border border-gray-300 rounded p-2 min-h-[160px] text-sm"
            placeholder="[Verse]&#10;..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标签 *（逗号分隔无空格）</label>
          <p className="text-xs text-gray-500 mb-2">
            与<a href="https://heartmula.github.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">官网 Demo</a>一致：风格、情绪、乐器等均通过标签组合控制；可多选组合。参考音频、分段落精细控制为规划中能力，当前开源版仅支持全局 tags + 歌词。
          </p>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            required
            className="w-full border border-gray-300 rounded p-2 text-sm"
            placeholder="例: warm,reflection,pop,Cafe 或 wedding,Piano,Strings,acoustic guitar,pop,Romantic"
          />
          <div className="mt-3 space-y-2">
            {[
              {
                group: '情绪 / 氛围',
                tags: [
                  { label: '温暖', value: 'warm' },
                  { label: '反思', value: 'reflection' },
                  { label: '柔和', value: 'soft' },
                  { label: '悲伤', value: 'Sad' },
                  { label: '遗憾', value: 'Regret' },
                  { label: '渴望', value: 'Longing' },
                  { label: '希望', value: 'hope' },
                  { label: '欢快', value: 'hopeful' },
                  { label: '平和', value: 'peaceful' },
                  { label: '感性', value: 'emotional' },
                  { label: '活力', value: 'energetic' },
                  { label: '自我发现', value: 'self-discovery' },
                ],
              },
              {
                group: '流派 / 风格',
                tags: [
                  { label: '流行', value: 'pop' },
                  { label: 'R&B', value: 'R&B' },
                  { label: '民谣/叙事', value: 'Ballad' },
                  { label: '电子', value: 'electronic' },
                  { label: '摇滚', value: 'rock' },
                  { label: '浪漫', value: 'Romantic' },
                  { label: '咖啡厅', value: 'Cafe' },
                  { label: '冥想', value: 'meditation' },
                  { label: '信仰', value: 'faith' },
                  { label: '行走感', value: 'Walking' },
                  { label: '强力/史诗', value: 'powerful' },
                  { label: '史诗', value: 'epic' },
                  { label: '驱动感', value: 'driving' },
                ],
              },
              {
                group: '乐器 / 音色',
                tags: [
                  { label: '钢琴', value: 'Piano' },
                  { label: '键盘', value: 'Keyboard' },
                  { label: '弦乐', value: 'Strings' },
                  { label: '木吉他', value: 'acoustic guitar' },
                  { label: '电吉他', value: 'electric guitar' },
                  { label: '鼓机', value: 'drum machine' },
                  { label: '鼓', value: 'drums' },
                  { label: '合成器', value: 'synthesizer' },
                  { label: '原声', value: 'acoustic' },
                ],
              },
              {
                group: '场景 / 人声',
                tags: [
                  { label: '婚礼', value: 'wedding' },
                  { label: '男声', value: 'male vocal' },
                  { label: '女声', value: 'female vocal' },
                ],
              },
            ].map(({ group, tags: groupTags }) => (
              <div key={group}>
                <span className="text-xs font-medium text-gray-600">{group}</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {groupTags.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => appendTag(value)}
                      className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
          <h2 className="text-sm font-semibold text-gray-800 mb-3">生成参数配置</h2>
          <p className="text-xs text-gray-500 mb-3">以下为可选，不填则使用默认值。</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" title="最大音频长度（毫秒）">
                最大时长 max_audio_length_ms
              </label>
              <input
                type="number"
                min={8000}
                max={600000}
                step={1000}
                value={max_audio_length_ms}
                onChange={(e) => setMaxAudioLengthMs(Number(e.target.value))}
                className="w-full border border-gray-300 rounded p-2 text-sm"
                placeholder="240000"
              />
              <p className="text-xs text-gray-500 mt-0.5">毫秒，默认 240000（约 4 分钟）</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" title="Top-k 采样">
                topk
              </label>
              <input
                type="number"
                min={1}
                max={200}
                value={topk}
                onChange={(e) => setTopk(Number(e.target.value))}
                className="w-full border border-gray-300 rounded p-2 text-sm"
                placeholder="50"
              />
              <p className="text-xs text-gray-500 mt-0.5">采样 Top-k，默认 50</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" title="采样温度">
                temperature
              </label>
              <input
                type="number"
                step="0.1"
                min={0.1}
                max={2}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full border border-gray-300 rounded p-2 text-sm"
                placeholder="1.0"
              />
              <p className="text-xs text-gray-500 mt-0.5">采样温度，默认 1.0</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" title="Classifier-free guidance 强度">
                cfg_scale
              </label>
              <input
                type="number"
                step="0.1"
                min={1}
                max={3}
                value={cfg_scale}
                onChange={(e) => setCfgScale(Number(e.target.value))}
                className="w-full border border-gray-300 rounded p-2 text-sm"
                placeholder="1.5"
              />
              <p className="text-xs text-gray-500 mt-0.5">条件引导强度，默认 1.5</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">检查点 / 模型版本</label>
              <select
                value={effectiveVersion}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full border border-gray-300 rounded p-2 text-sm"
              >
                {modelList.length === 0 && <option value="">加载中…</option>}
                {versionOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-0.5">由后端 /api/models 返回的可用模型</p>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded font-medium disabled:opacity-50"
        >
          {loading ? '提交中...' : '提交任务'}
        </button>
      </form>
    </div>
  )
}
