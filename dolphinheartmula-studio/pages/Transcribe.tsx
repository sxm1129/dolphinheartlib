import React, { useState } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import {
  createTranscribe,
  getTask,
  pollTaskStatus,
  updateTask,
  getAudioUrl,
  type TaskResponse,
  type TranscribeParams,
} from '../services/api';
import { Mic, Loader2, FileAudio, Save, ChevronDown, ChevronUp } from 'lucide-react';

const DEFAULT_PARAMS: TranscribeParams = {
  max_new_tokens: 256,
  num_beams: 2,
  task: 'transcribe',
  condition_on_prev_tokens: false,
  compression_ratio_threshold: 1.8,
  logprob_threshold: -1.0,
  no_speech_threshold: 0.4,
};

const Transcribe: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [params, setParams] = useState<TranscribeParams>({ ...DEFAULT_PARAMS });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  const resultText =
    task?.result != null && typeof task.result === 'object' && task.result !== null && 'text' in task.result
      ? (task.result as { text?: string }).text ?? ''
      : task?.result != null
        ? String(task.result)
        : '';

  const hasAudio = Boolean(task?.output_audio_path);
  const displayText = taskId && task ? editText : resultText;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t('transcribe.selectFile') || '请选择音频文件');
      return;
    }
    setError(null);
    setTaskId(null);
    setTask(null);
    setEditText('');
    setLoading(true);
    createTranscribe(file, params)
      .then(({ task_id }) => {
        setTaskId(task_id);
        return pollTaskStatus(task_id, (t) => setTask(t));
      })
      .then((completedTask) => {
        setTask(completedTask);
        const text =
          completedTask.result != null &&
          typeof completedTask.result === 'object' &&
          completedTask.result !== null &&
          'text' in completedTask.result
            ? (completedTask.result as { text?: string }).text ?? ''
            : completedTask.result != null
              ? String(completedTask.result)
              : '';
        setEditText(text);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Transcribe failed'))
      .finally(() => setLoading(false));
  };

  const handleSaveResult = () => {
    if (!taskId || task?.type !== 'transcribe') return;
    setSaving(true);
    updateTask(taskId, { result: { text: editText } })
      .then((updated) => {
        setTask(updated);
        const text =
          updated.result != null && typeof updated.result === 'object' && updated.result !== null && 'text' in updated.result
            ? (updated.result as { text?: string }).text ?? ''
            : updated.result != null
              ? String(updated.result)
              : '';
        setEditText(text);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Save failed'))
      .finally(() => setSaving(false));
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark text-slate-200">
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Mic className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('transcribe.title')}</h1>
            <p className="text-xs text-slate-500">{t('transcribe.subtitle')}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        {!taskId ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-surface-dark">
              <div className="p-3 bg-slate-800/50 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <FileAudio className="w-3 h-3 text-primary" /> {t('transcribe.audioFile')}
                </span>
              </div>
              <div className="p-4">
                <input
                  type="file"
                  accept=".mp3,.wav,.ogg,.flac,.m4a,.webm,audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-white file:font-medium file:cursor-pointer hover:file:bg-primary-hover"
                />
                {file && (
                  <p className="text-xs text-slate-500 mt-2">
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden bg-surface-dark">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between p-3 bg-slate-800/50 border-b border-slate-800 text-left hover:bg-slate-800/70 transition-colors"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {t('transcribe.params')}
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>
              {showAdvanced && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">max_new_tokens</label>
                    <input
                      type="number"
                      value={params.max_new_tokens ?? 256}
                      onChange={(e) => setParams((p) => ({ ...p, max_new_tokens: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">num_beams</label>
                    <input
                      type="number"
                      value={params.num_beams ?? 2}
                      onChange={(e) => setParams((p) => ({ ...p, num_beams: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">task</label>
                    <input
                      type="text"
                      value={params.task ?? 'transcribe'}
                      onChange={(e) => setParams((p) => ({ ...p, task: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">condition_on_prev_tokens</label>
                    <select
                      value={String(params.condition_on_prev_tokens ?? false)}
                      onChange={(e) => setParams((p) => ({ ...p, condition_on_prev_tokens: e.target.value === 'true' }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    >
                      <option value="false">false</option>
                      <option value="true">true</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">compression_ratio_threshold</label>
                    <input
                      type="number"
                      step={0.1}
                      value={params.compression_ratio_threshold ?? 1.8}
                      onChange={(e) => setParams((p) => ({ ...p, compression_ratio_threshold: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">logprob_threshold</label>
                    <input
                      type="number"
                      step={0.1}
                      value={params.logprob_threshold ?? -1.0}
                      onChange={(e) => setParams((p) => ({ ...p, logprob_threshold: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1">no_speech_threshold</label>
                    <input
                      type="number"
                      step={0.1}
                      value={params.no_speech_threshold ?? 0.4}
                      onChange={(e) => setParams((p) => ({ ...p, no_speech_threshold: Number(e.target.value) }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t('transcribe.submitting')}</span>
                </>
              ) : (
                <span>{t('transcribe.submit')}</span>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-surface-dark">
              <div className="p-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('transcribe.taskDetail')}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    task?.status === 'completed'
                      ? 'bg-green-900/30 text-green-400'
                      : task?.status === 'failed'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {task?.status ?? '…'}
                </span>
              </div>
              <dl className="p-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                <dt className="text-slate-500">ID</dt>
                <dd className="font-mono text-slate-300">{taskId}</dd>
                <dt className="text-slate-500">{t('transcribe.created')}</dt>
                <dd className="text-slate-300">{task?.created_at ? new Date(task.created_at).toLocaleString() : '—'}</dd>
              </dl>
            </div>

            {task?.error_message && (
              <div className="p-3 rounded-lg bg-red-900/20 border border-red-800/50 text-red-300 text-sm">
                {task.error_message}
              </div>
            )}

            {hasAudio && task && (
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-surface-dark">
                <div className="p-3 bg-slate-800/50 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('transcribe.preview')}</span>
                </div>
                <div className="p-4">
                  <audio controls className="w-full" src={getAudioUrl(taskId)} />
                </div>
              </div>
            )}

            {task?.type === 'transcribe' && (
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-surface-dark">
                <div className="p-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('transcribe.result')}</span>
                  <button
                    type="button"
                    onClick={handleSaveResult}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-white text-xs font-medium hover:bg-primary-hover disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    {saving ? t('transcribe.saving') : t('transcribe.saveResult')}
                  </button>
                </div>
                <div className="p-4">
                  <textarea
                    value={taskId && task ? editText : displayText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-300 min-h-[160px] focus:ring-1 focus:ring-primary focus:border-primary outline-none placeholder-slate-500"
                    placeholder={t('transcribe.resultPlaceholder')}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setTaskId(null);
                setTask(null);
                setFile(null);
                setEditText('');
                setParams({ ...DEFAULT_PARAMS });
              }}
              className="w-full py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors text-sm font-medium"
            >
              {t('transcribe.newTask')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transcribe;
