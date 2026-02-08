import React, { useState, useEffect, useRef } from 'react';
import { 
  Undo, Redo, Play, Pause, SkipBack, SkipForward, 
  Mic, Volume2, Settings, Download, Upload, Clock, Menu,
  Wand2, Music, Layers, Edit3, Share2, Loader2, History,
  Smile, Zap, Plus, X, RotateCcw, ChevronRight, ChevronLeft
} from 'lucide-react';
import WaveformViz from '../components/WaveformViz';
import { useTranslation } from '../contexts/LanguageContext';
import { generateAudio, getTask, getAudioUrl, pollTaskStatus, TaskResponse, updateProject, getModelList, getTasks, getProject, uploadReferenceAudio, deleteUploadedFile, UploadResponse, createShare, getGpuInfo, GpuInfo, generateLyrics } from '../services/api';
import { useProject } from '../contexts/ProjectContext';
import { LyricsLanguage, LYRICS_LANGUAGES, getLyricsLanguagePreference, setLyricsLanguagePreference } from '../utils/lyricsPrompt';

const GENRES = ['Electronic', 'Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Jazz', 'Metal', 'Folk', 'Ambient'];
const MOODS = ['Dark', 'Happy', 'Sad', 'Energetic', 'Chill', 'Romantic', 'Nostalgic', 'Angry', 'Dreamy'];

const TAG_GROUPS: { group: string; tags: { label: string; value: string }[] }[] = [
  { group: '情绪 / 氛围', tags: [{ label: '温暖', value: 'warm' }, { label: '反思', value: 'reflection' }, { label: '柔和', value: 'soft' }, { label: '悲伤', value: 'Sad' }, { label: '遗憾', value: 'Regret' }, { label: '渴望', value: 'Longing' }, { label: '希望', value: 'hope' }, { label: '欢快', value: 'hopeful' }, { label: '平和', value: 'peaceful' }, { label: '感性', value: 'emotional' }, { label: '活力', value: 'energetic' }, { label: '自我发现', value: 'self-discovery' }] },
  { group: '流派 / 风格', tags: [{ label: '流行', value: 'pop' }, { label: 'R&B', value: 'R&B' }, { label: '民谣/叙事', value: 'Ballad' }, { label: '电子', value: 'electronic' }, { label: '摇滚', value: 'rock' }, { label: '浪漫', value: 'Romantic' }, { label: '咖啡厅', value: 'Cafe' }, { label: '冥想', value: 'meditation' }, { label: '信仰', value: 'faith' }, { label: '行走感', value: 'Walking' }, { label: '强力/史诗', value: 'powerful' }, { label: '史诗', value: 'epic' }, { label: '驱动感', value: 'driving' }] },
  { group: '乐器 / 音色', tags: [{ label: '钢琴', value: 'Piano' }, { label: '键盘', value: 'Keyboard' }, { label: '弦乐', value: 'Strings' }, { label: '木吉他', value: 'acoustic guitar' }, { label: '电吉他', value: 'electric guitar' }, { label: '鼓机', value: 'drum machine' }, { label: '鼓', value: 'drums' }, { label: '合成器', value: 'synthesizer' }, { label: '原声', value: 'acoustic' }] },
  { group: '场景 / 人声', tags: [{ label: '婚礼', value: 'wedding' }, { label: '男声', value: 'male vocal' }, { label: '女声', value: 'female vocal' }] },
];

/** Default max audio length (ms) and cfg_scale when not restored from task. */
const DEFAULT_MAX_AUDIO_LENGTH_MS = 240_000;
const DEFAULT_CFG_SCALE = 1.5;

const Studio: React.FC = () => {
  const { t } = useTranslation();
  const { currentProject, currentProjectId, setCurrentProject } = useProject();
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentProjectIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  
  const [lyrics, setLyrics] = useState(`[Intro]
(Instrumental build-up)

[Verse 1]
Neon lights flickering in the rain
Cybernetic dreams driving me insane
I walk the streets of code and wire
Burning with this digital desire...`);

  const [lyricPrompt, setLyricPrompt] = useState("");
  const [genre, setGenre] = useState("Electronic");
  const [mood, setMood] = useState("Dark");
  const [tags, setTags] = useState('warm,pop,Romantic,Piano');
  const appendTag = (value: string) => {
    const v = value.trim();
    if (!v) return;
    setTags((prev) => (prev ? `${prev},${v}` : v));
  };

  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [lyricsHistory, setLyricsHistory] = useState<Array<{text: string, timestamp: Date}>>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lyricsLanguage, setLyricsLanguage] = useState<LyricsLanguage>(() => getLyricsLanguagePreference());

  // Audio Generation State
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioTaskId, setAudioTaskId] = useState<string | null>(null);
  const [audioTaskStatus, setAudioTaskStatus] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180); // 3:00 default duration

  // Gen Config: model (checkpoint), temperature, topk, max_audio_length_ms, cfg_scale
  const [checkpoint, setCheckpoint] = useState('HeartMula-Pro-4B (v2.1)');
  const [temperature, setTemperature] = useState(0.85);
  const [topk, setTopk] = useState(50);
  const [maxAudioLengthMs, setMaxAudioLengthMs] = useState(DEFAULT_MAX_AUDIO_LENGTH_MS);
  const [cfgScale, setCfgScale] = useState(DEFAULT_CFG_SCALE);
  
  const [modelList, setModelList] = useState<string[]>([]);
  const [gpuInfo, setGpuInfo] = useState<GpuInfo | null>(null);

  // Load models & GPU info on mount
  useEffect(() => {
    getModelList().then(setModelList);
    
    // Initial fetch
    getGpuInfo().then(setGpuInfo);

    // Poll GPU info every 10s
    const timer = setInterval(() => {
      getGpuInfo().then(setGpuInfo);
    }, 10000);

    return () => clearInterval(timer);
  }, []);

  const [modelListLoading, setModelListLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [updateProjectError, setUpdateProjectError] = useState<string | null>(null);

  // Reference Audio Upload State
  const [refAudioFile, setRefAudioFile] = useState<UploadResponse | null>(null);
  const [isUploadingRef, setIsUploadingRef] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const refInputRef = useRef<HTMLInputElement | null>(null);

  // Task History Panel State
  const [taskHistory, setTaskHistory] = useState<TaskResponse[]>([]);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [projectNotFound, setProjectNotFound] = useState(false);

  // Keep ref in sync for race-condition checks
  currentProjectIdRef.current = currentProjectId;
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // Keyboard shortcuts: Space = play/pause, Cmd+Enter = generate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Cmd+Enter even in textarea for generation
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          if (!isGeneratingAudio && lyrics.trim()) {
            handleGenerateAudio();
          }
        }
        return;
      }
      
      // Space: toggle playback
      if (e.key === ' ' && audioUrl) {
        e.preventDefault();
        togglePlayback();
      }
      // Cmd/Ctrl + Enter: generate audio
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isGeneratingAudio && lyrics.trim()) {
          handleGenerateAudio();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // Note: handleGenerateAudio and togglePlayback are stable functions from component scope
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, isGeneratingAudio, lyrics]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  useEffect(() => {
    setModelListLoading(true);
    getModelList()
      .then((list) => {
        setModelList(list);
        if (list.length === 1) setCheckpoint(list[0]);
      })
      .catch(() => setModelList([]))
      .finally(() => setModelListLoading(false));
  }, []);

  useEffect(() => {
    // Load task history for current project and restore latest task params
    const requestedId = currentProjectId;
    if (currentProjectId) {
      setLoadingHistory(true);
      setTaskLoading(true);
      getTasks({ project_id: currentProjectId, type: 'generate', page_size: 20 })
        .then((res) => {
          if (!isMountedRef.current || currentProjectIdRef.current !== requestedId) return;
          const items = res.items || [];
          setTaskHistory(items);
          
          // Restore params from latest task
          const task = items[0];
          if (task?.id) {
            const params = task.params as { lyrics?: string; tags?: string; max_audio_length_ms?: number; cfg_scale?: number } | undefined;
            if (params?.lyrics && typeof params.lyrics === 'string') {
              setLyrics(params.lyrics.trim());
            } else {
              setLyrics('');
            }
            if (params?.tags != null && typeof params.tags === 'string') {
              setTags(params.tags.trim());
            } else {
              setTags('');
            }
            if (params?.max_audio_length_ms != null && Number.isFinite(params.max_audio_length_ms)) {
              setMaxAudioLengthMs(Math.max(8000, Math.min(600000, params.max_audio_length_ms)));
            } else {
              setMaxAudioLengthMs(DEFAULT_MAX_AUDIO_LENGTH_MS);
            }
            if (params?.cfg_scale != null && Number.isFinite(params.cfg_scale)) {
              setCfgScale(Math.max(1, Math.min(3, params.cfg_scale)));
            } else {
              setCfgScale(DEFAULT_CFG_SCALE);
            }
            if (task.status === 'completed' && task.output_audio_path) {
              setAudioTaskId(task.id);
              setAudioUrl(getAudioUrl(task.id));
              setAudioTaskStatus('completed');
              const ms = params?.max_audio_length_ms || DEFAULT_MAX_AUDIO_LENGTH_MS;
              setDuration(ms / 1000);
            } else {
              setAudioTaskId(null);
              setAudioUrl(null);
              setAudioTaskStatus('');
            }
          } else {
            // No tasks, reset all
            setLyrics('');
            setTags('');
            setMaxAudioLengthMs(DEFAULT_MAX_AUDIO_LENGTH_MS);
            setCfgScale(DEFAULT_CFG_SCALE);
            setAudioTaskId(null);
            setAudioUrl(null);
            setAudioTaskStatus('');
          }
        })
        .catch(console.error)
        .finally(() => {
          if (isMountedRef.current) {
            setLoadingHistory(false);
            setTaskLoading(false);
          }
        });
    } else {
      setTaskHistory([]);
      setLyrics('');
      setTags('');
      setMaxAudioLengthMs(DEFAULT_MAX_AUDIO_LENGTH_MS);
      setCfgScale(DEFAULT_CFG_SCALE);
      setAudioTaskId(null);
      setAudioUrl(null);
      setAudioTaskStatus('');
    }
  }, [currentProjectId]);

  useEffect(() => {
    if (!currentProjectId || currentProject) return;
    setProjectNotFound(false);
    getProject(currentProjectId)
      .then((p) => setCurrentProject({ ...p, createdAt: p.created_at || (p as { createdAt?: string }).createdAt || '' }))
      .catch((err) => {
        const is404 = (err instanceof Error && (err.message.includes('404') || err.message.includes('Not Found'))) || false;
        if (is404) {
          setCurrentProject(null);
          setProjectNotFound(true);
        }
      });
  }, [currentProjectId, currentProject, setCurrentProject]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  const handleScrub = (progress: number) => {
    const d = duration && Number.isFinite(duration) ? duration : (audioRef.current?.duration ?? 0);
    const t = Math.max(0, Math.min(d, progress * d));
    setCurrentTime(t);
    if (audioRef.current && Number.isFinite(t)) {
      audioRef.current.currentTime = t;
    }
  };

  const handleGenerateLyrics = async () => {
    if (isGeneratingLyrics) return;
    setLyricsError(null);
    setIsGeneratingLyrics(true);

    try {
      // Use backend API to generate lyrics
      // The backend handles prompt construction and LLM calls (OpenRouter/Gemini)
      const data = await generateLyrics({
        language: lyricsLanguage,
        genre,
        mood,
        topic: lyricPrompt.trim() || undefined,
      });

      if (!data.lyrics) {
        throw new Error(t('studio.lyricsErrorEmpty') || 'No lyrics generated');
      }

      setLyrics(data.lyrics);
      
      // Update history
      const newEntry = { text: data.lyrics, timestamp: new Date() };
      setLyricsHistory(prev => [newEntry, ...prev]);

    } catch (err: any) {
      console.error('Lyrics generation error:', err);
      setLyricsError(err.message || t('studio.lyricsError') || 'Lyrics generation failed');
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handleLyricInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerateLyrics();
    }
  };

  // Handle audio generation
  const handleGenerateAudio = async () => {
    if (isGeneratingAudio || !lyrics.trim()) return;
    
    setIsGeneratingAudio(true);
    setAudioError(null);
    setAudioUrl(null);
    setAudioTaskStatus('pending');
    
    try {
      // topk: heartlib expects integer 1-200
      const topkVal = Math.min(200, Math.max(1, topk));
      const ms = Math.max(8000, Math.min(600000, maxAudioLengthMs));
      const cfg = Math.max(1, Math.min(3, cfgScale));
      const { task_id } = await generateAudio({
        lyrics: lyrics,
        tags: tags.trim() || `${genre}, ${mood}`,
        temperature: temperature,
        topk: topkVal,
        cfg_scale: cfg,
        max_audio_length_ms: ms,
        version: checkpoint,
        project_id: currentProjectId || undefined,
        ref_file_id: refAudioFile?.file_id || undefined,
      });
      
      if (!isMountedRef.current) return;
      setAudioTaskId(task_id);
      setAudioTaskStatus('running');
      
      const completedTask = await pollTaskStatus(
        task_id,
        (task) => {
          if (isMountedRef.current) setAudioTaskStatus(task.status);
        }
      );
      
      if (!isMountedRef.current) return;
      if (completedTask.status === 'completed') {
        setAudioUrl(getAudioUrl(task_id));
        setAudioTaskStatus('completed');
        const durationSec = ms / 1000;
        setDuration(durationSec);
        const durationStr = `${Math.floor(durationSec / 60)}:${String(Math.floor(durationSec % 60)).padStart(2, '0')}`;
        if (currentProjectId) {
          setUpdateProjectError(null);
          updateProject(currentProjectId, { duration: durationStr, status: 'Generated' })
            .then(() => {
              if (isMountedRef.current && currentProject) setCurrentProject({ ...currentProject, duration: durationStr, status: 'Generated' });
            })
            .catch((err) => { if (isMountedRef.current) setUpdateProjectError(err instanceof Error ? err.message : '更新项目失败'); });
        }
      } else {
        setAudioError(completedTask.error_message || 'Generation failed');
        setAudioTaskStatus('failed');
      }
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error('Audio generation failed:', error);
      setAudioError(error instanceof Error ? error.message : 'Unknown error');
      setAudioTaskStatus('failed');
    } finally {
      if (isMountedRef.current) setIsGeneratingAudio(false);
    }
  };

  // Select a task from history to play
  const handleSelectHistoryTask = (task: TaskResponse) => {
    if (task.status !== 'completed' || !task.output_audio_path) return;
    setAudioTaskId(task.id);
    setAudioUrl(getAudioUrl(task.id));
    setAudioTaskStatus('completed');
    const params = task.params as { lyrics?: string; tags?: string; max_audio_length_ms?: number; cfg_scale?: number } | undefined;
    if (params?.lyrics) setLyrics(params.lyrics);
    if (params?.tags) setTags(params.tags);
    const ms = params?.max_audio_length_ms || DEFAULT_MAX_AUDIO_LENGTH_MS;
    setDuration(ms / 1000);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Handle audio playback with actual audio element
  const togglePlayback = () => {
    if (audioRef.current && audioUrl) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else {
      // Mock playback for when no audio is loaded
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark text-slate-200">
      {/* Hidden audio element for playback; required for generated audio to be audible */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onDurationChange={() => audioRef.current && setDuration(audioRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Top Bar */}
      <div className="h-14 border-b border-slate-800 bg-surface-dark flex items-center px-4 justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className="lg:hidden p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent font-bold text-lg font-display">
                Pro Studio
            </span>
            <span className="text-xs text-slate-500 border border-slate-700 rounded px-1">v2.1</span>
          </div>
          <div className="h-6 w-px bg-slate-700 mx-2"></div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="material-symbols-rounded text-sm">folder_open</span>
            <span>{currentProject?.title || t('studio.untitled')}</span>
            {taskLoading && <Loader2 className="w-3 h-3 text-slate-500 animate-spin ml-1" />}
            <span className="bg-green-500/10 text-green-500 text-[10px] px-1.5 py-0.5 rounded border border-green-500/20 font-bold uppercase ml-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                {t('studio.live')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
             <div className="flex items-center bg-slate-800 rounded-md p-0.5 border border-slate-700 hidden md:flex">
                <button className="px-3 py-1 rounded bg-slate-700 shadow text-xs font-medium text-white">{t('studio.compose')}</button>
                <button className="px-3 py-1 rounded hover:bg-slate-700/50 text-xs font-medium text-slate-500 transition-colors">{t('studio.mastering')}</button>
             </div>
                          <button
                disabled={!audioTaskId || audioTaskStatus !== 'completed'}
                onClick={async () => {
                  if (!audioTaskId) return;
                  try {
                    const share = await createShare(audioTaskId, currentProject?.title);
                    const shareUrl = `${window.location.origin}/share/${share.id}`;
                    await navigator.clipboard.writeText(shareUrl);
                    alert(t('studio.shareCopied') || `分享链接已复制: ${shareUrl}`);
                  } catch (err) {
                    alert(`分享失败: ${err instanceof Error ? err.message : '未知错误'}`);
                  }
                }}
                className={`flex items-center gap-1.5 ${audioTaskId && audioTaskStatus === 'completed' ? 'bg-primary hover:bg-primary-hover' : 'bg-slate-700 cursor-not-allowed'} text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-purple-900/30`}
              >
                <Share2 className="w-3 h-3" />
                {t('studio.share')}
             </button>

             <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-surface-dark flex items-center justify-center text-xs font-bold">S</div>
                <div className="w-7 h-7 rounded-full bg-pink-600 border-2 border-surface-dark flex items-center justify-center text-xs font-bold">A</div>
             </div>
        </div>
      </div>

      {/* Error banners: generation failure, updateProject failure, project not found */}
      {(audioError || updateProjectError || projectNotFound) && (
        <div className="shrink-0 px-4 py-2 bg-red-950/80 border-b border-red-900/50 flex flex-wrap items-center gap-3 text-sm">
          {projectNotFound && (
            <span className="flex items-center gap-2 text-amber-300">
              <span>{t('studio.projectNotFound') || '项目不存在或已删除'}</span>
              <button type="button" onClick={() => setProjectNotFound(false)} className="text-amber-400 hover:text-amber-200 p-0.5" aria-label="关闭"><X className="w-4 h-4" /></button>
            </span>
          )}
          {audioError && (
            <span className="flex items-center gap-2 text-red-300">
              <span>{t('studio.genError') || '生成失败'}: {audioError}</span>
              <button type="button" onClick={() => setAudioError(null)} className="text-red-400 hover:text-red-200 p-0.5" aria-label="关闭"><X className="w-4 h-4" /></button>
            </span>
          )}
          {updateProjectError && (
            <span className="flex items-center gap-2 text-red-300">
              <span>{t('studio.updateProjectError') || '更新项目失败'}: {updateProjectError}</span>
              <button type="button" onClick={() => setUpdateProjectError(null)} className="text-red-400 hover:text-red-200 p-0.5" aria-label="关闭"><X className="w-4 h-4" /></button>
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Config Panel - hidden on mobile when collapsed */}
        <aside className={`${showLeftPanel ? 'w-72' : 'w-0 hidden'} lg:w-72 lg:block bg-[#161b28] border-r border-slate-800 flex flex-col overflow-y-auto shrink-0 z-20 custom-scrollbar transition-all duration-200`}>
            <div className="p-4 space-y-6">
                
                {/* Model Config Group */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-surface-dark">
                    <div className="w-full flex items-center justify-between p-3 bg-slate-800/50">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <Wand2 className="w-3 h-3 text-primary" /> {t('studio.modelConfig')}
                        </span>
                    </div>
                    <div className="p-3 space-y-4 border-t border-slate-800">
                        <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-1.5 uppercase">{t('studio.checkpoint')}</label>
                            {modelListLoading ? (
                              <div className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-500">{t('studio.loading') || '加载中…'}</div>
                            ) : (() => {
                                const options = modelList.length > 0 ? modelList : ['HeartMula-Pro-4B (v2.1)', 'HeartMula-Fast-2B', 'HeartCodec-Studio-HQ', 'HeartMula-3B (Standard)'];
                                if (options.length === 1) {
                                  return (
                                    <div className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300" title={t('studio.singleModel') || '当前后端仅有一个模型'}>{options[0]}</div>
                                  );
                                }
                                return (
                                  <select
                                    value={checkpoint}
                                    onChange={(e) => setCheckpoint(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                                  >
                                    {options.map((m) => (
                                      <option key={m} value={m}>{m}</option>
                                    ))}
                                  </select>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Tags: 与 10002 生成页一致的标签选择，提交到后端 */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-surface-dark">
                    <div className="w-full flex items-center justify-between p-3 bg-slate-800/50">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <Layers className="w-3 h-3 text-primary" /> {t('studio.tags')}
                        </span>
                    </div>
                    <div className="p-3 space-y-3 border-t border-slate-800">
                        <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-1.5 uppercase">{t('studio.tagsComma')}</label>
                            <input
                                type="text"
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                placeholder="warm,pop,Piano,Romantic"
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {TAG_GROUPS.map(({ group, tags: groupTags }) => (
                                <div key={group}>
                                    <span className="text-[10px] font-medium text-slate-500 block mb-1">{group}</span>
                                    <div className="flex flex-wrap gap-1">
                                        {groupTags.map(({ label, value }) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => appendTag(value)}
                                                className="px-2 py-0.5 text-[10px] rounded border border-slate-600 bg-slate-800/80 hover:bg-slate-700 hover:border-slate-500 text-slate-300 transition-colors"
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Gen Settings Group */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-surface-dark">
                     <div className="w-full flex items-center justify-between p-3 bg-slate-800/50">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <Settings className="w-3 h-3 text-primary" /> {t('studio.genSettings')}
                        </span>
                    </div>
                    <div className="p-3 space-y-4 border-t border-slate-800">
                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] uppercase text-slate-400">{t('studio.creativity')}</label>
                                <span className="text-[10px] font-mono text-primary">{temperature.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.1" max="1.5" step="0.05"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary" 
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="text-[10px] uppercase text-slate-400">{t('studio.topk')}</label>
                                <span className="text-[10px] font-mono text-primary">{topk}</span>
                            </div>
                            <input 
                                type="number" 
                                min={1} max={200} step={1}
                                value={topk}
                                onChange={(e) => setTopk(Math.max(1, Math.min(200, Number(e.target.value) || 50)))}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-0.5">{t('studio.topkHint')}</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-1 uppercase">{t('studio.maxAudioLengthMs')}</label>
                            <input
                                type="number"
                                min={8000}
                                max={600000}
                                step={1000}
                                value={maxAudioLengthMs}
                                onChange={(e) => setMaxAudioLengthMs(Math.max(8000, Math.min(600000, Number(e.target.value) || 240000)))}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-0.5">{t('studio.maxAudioLengthMsHint')}</p>
                        </div>

                        <div>
                            <label className="block text-[10px] font-medium text-slate-400 mb-1 uppercase">cfg_scale</label>
                            <input
                                type="number"
                                step={0.1}
                                min={1}
                                max={3}
                                value={cfgScale}
                                onChange={(e) => setCfgScale(Math.max(1, Math.min(3, Number(e.target.value) || 1.5)))}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-0.5">{t('studio.cfgScaleHint')}</p>
                        </div>
                    </div>
                </div>

                {/* Reference Audio Upload */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-surface-dark">
                    <div className="w-full flex items-center justify-between p-3 bg-slate-800/50">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                            <Upload className="w-3 h-3 text-primary" /> {t('studio.refAudio')}
                        </span>
                    </div>
                    <div className="p-3 border-t border-slate-800">
                        <input
                            ref={refInputRef}
                            type="file"
                            accept=".mp3,.wav,.flac,.ogg,.m4a,.aac"
                            className="hidden"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setIsUploadingRef(true);
                                setUploadError(null);
                                try {
                                    const res = await uploadReferenceAudio(file);
                                    setRefAudioFile(res);
                                } catch (err) {
                                    setUploadError(err instanceof Error ? err.message : 'Upload failed');
                                } finally {
                                    setIsUploadingRef(false);
                                    if (refInputRef.current) refInputRef.current.value = '';
                                }
                            }}
                        />
                        {refAudioFile ? (
                            <div className="flex items-center justify-between bg-slate-900 rounded px-3 py-2">
                                <div className="flex items-center gap-2 text-xs text-slate-300 truncate">
                                    <Music className="w-4 h-4 text-primary" />
                                    <span className="truncate max-w-[160px]">{refAudioFile.filename}</span>
                                    <span className="text-slate-500">({(refAudioFile.size / 1024).toFixed(1)} KB)</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            await deleteUploadedFile(refAudioFile.file_id);
                                        } catch { /* ignore */ }
                                        setRefAudioFile(null);
                                    }}
                                    className="text-slate-400 hover:text-red-400 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => refInputRef.current?.click()}
                                disabled={isUploadingRef}
                                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-600 rounded-lg text-xs text-slate-400 hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                            >
                                {isUploadingRef ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('studio.uploading')}</>
                                ) : (
                                    <><Upload className="w-4 h-4" /> {t('studio.uploadRefAudio')}</>
                                )}
                            </button>
                        )}
                        {uploadError && <p className="text-[10px] text-red-400 mt-1">{uploadError}</p>}
                        <p className="text-[10px] text-slate-500 mt-1.5">{t('studio.refAudioHint')}</p>
                    </div>
                </div>
            </div>

            {/* Generate Audio: main entry to trigger music generation */}
            <div className="p-4 border-t border-slate-800">
                <button
                    type="button"
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio || !lyrics.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-purple-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                >
                    {isGeneratingAudio ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{t('studio.generating')}</span>
                        </>
                    ) : (
                        <>
                            <Zap className="w-5 h-5" />
                            <span>{t('studio.generateMusic')}</span>
                        </>
                    )}
                </button>
                {!lyrics.trim() && (
                    <p className="text-[10px] text-slate-500 mt-1.5 text-center">{t('studio.generateMusicHint')}</p>
                )}
            </div>

            <div className="mt-auto p-4 border-t border-slate-800 bg-surface-dark">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                    <span title={gpuInfo?.device_name || 'GPU'}>{t('studio.vram')}</span>
                    <span className="text-slate-300">
                        {gpuInfo?.available 
                            ? `${gpuInfo.used_gb} / ${gpuInfo.total_gb} GB`
                            : t('studio.cpuMode')}
                    </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                            !gpuInfo?.available ? 'bg-slate-600 w-full' :
                            (gpuInfo.used_gb! / gpuInfo.total_gb! > 0.9) ? 'bg-red-500' :
                            (gpuInfo.used_gb! / gpuInfo.total_gb! > 0.7) ? 'bg-yellow-500' :
                            'bg-gradient-to-r from-primary to-blue-500'
                        }`} 
                        style={{
                            width: gpuInfo?.available 
                                ? `${Math.min((gpuInfo.used_gb! / gpuInfo.total_gb!) * 100, 100)}%` 
                                : '100%'
                        }}
                    ></div>
                </div>
            </div>
        </aside>

        {/* Center Main Stage */}
        <main className="flex-1 flex flex-col min-w-0 relative">
            
            {/* Toolbar */}
            <div className="h-10 border-b border-slate-800 bg-surface-dark flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        <button className="text-slate-400 hover:text-white p-1"><Undo className="w-4 h-4" /></button>
                        <button className="text-slate-400 hover:text-white p-1"><Redo className="w-4 h-4" /></button>
                    </div>
                    <div className="h-4 w-px bg-slate-700"></div>
                    <div className="flex gap-2">
                        <span className="bg-primary/20 text-primary border border-primary/30 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">{t('studio.verse1')}</span>
                        <span className="bg-slate-800 text-slate-400 border border-slate-700 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider hover:text-slate-200 cursor-pointer">{t('studio.addSection')}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{t('studio.bpm')}: <span className="text-slate-300">128</span></span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{t('studio.key')}: <span className="text-slate-300">C Min</span></span>
                </div>
            </div>

            {/* Split View */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                
                {/* Top: Lyric Editor */}
                <div className="h-[45%] flex border-b border-slate-800">
                    <div className="flex-1 flex flex-col bg-[#0f1219]">
                        <div className="flex items-center justify-between px-4 py-2 bg-surface-dark border-b border-slate-800">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                <Edit3 className="w-3 h-3" /> {t('studio.lyricEditor')}
                            </span>
                            <div className="flex items-center gap-3">
                                {/* History Dropdown */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowHistory(!showHistory)}
                                        className={`text-[10px] flex items-center gap-1 px-2 py-1 rounded transition-colors border ${showHistory ? 'bg-primary/20 text-primary border-primary/30' : 'text-slate-500 hover:text-slate-300 border-transparent'}`}
                                    >
                                        <History className="w-3 h-3" />
                                        <span className="hidden sm:inline">{t('studio.history')}</span>
                                    </button>
                                    
                                    {showHistory && (
                                        <div className="absolute top-full right-0 mt-2 w-80 bg-[#161b28] border border-slate-700 rounded-lg shadow-2xl z-50 flex flex-col max-h-96">
                                            <div className="p-3 border-b border-slate-700 bg-surface-dark rounded-t-lg flex justify-between items-center">
                                                <h4 className="text-xs font-bold text-slate-300">{t('studio.genHistory')}</h4>
                                                <button onClick={() => setShowHistory(false)} className="text-slate-500 hover:text-white text-[10px]">{t('studio.close')}</button>
                                            </div>
                                            <div className="overflow-y-auto flex-1 p-2 space-y-2">
                                                {lyricsHistory.length === 0 ? (
                                                    <div className="text-[10px] text-slate-500 text-center py-4">{t('studio.noLyrics')}</div>
                                                ) : (
                                                    lyricsHistory.map((item, idx) => (
                                                        <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 group transition-all flex flex-col gap-2">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">v{lyricsHistory.length - idx}</span>
                                                                    <span className="text-[10px] text-slate-500">{item.timestamp.toLocaleTimeString()}</span>
                                                                </div>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setLyrics(item.text);
                                                                        setShowHistory(false);
                                                                    }}
                                                                    className="text-[10px] bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                                                >
                                                                    <RotateCcw className="w-3 h-3" /> {t('studio.revert')}
                                                                </button>
                                                            </div>
                                                            <div className="p-2 bg-slate-900/50 rounded text-[10px] text-slate-400 font-mono leading-relaxed line-clamp-3 border border-slate-800 cursor-default">
                                                                {item.text}
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button className="text-[10px] flex items-center gap-1 text-primary bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors border border-primary/20">
                                    <Wand2 className="w-3 h-3" /> {t('studio.aiSuggest')}
                                </button>
                                <span className="text-[10px] font-mono text-slate-500">{t('studio.tokens')}: <span className="text-green-400">124</span>/512</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-0">
                            <textarea 
                                className="w-full h-full bg-transparent p-6 outline-none font-mono text-sm leading-relaxed resize-none text-slate-300 placeholder-slate-600 focus:ring-0 border-0"
                                value={lyrics}
                                onChange={(e) => setLyrics(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* AI 歌词生成：流派/情绪/关键词 + 生成，放在歌词编辑器下方，不遮挡歌词 */}
                <div className="shrink-0 border-b border-slate-800 bg-surface-dark px-4 py-3 flex flex-col gap-3">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <Music className="w-3 h-3 text-slate-500" />
                            </div>
                            <select 
                                value={genre} 
                                onChange={(e) => setGenre(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 pl-8 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                            >
                                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <Smile className="w-3 h-3 text-slate-500" />
                            </div>
                            <select 
                                value={mood} 
                                onChange={(e) => setMood(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 pl-8 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                            >
                                {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        {/* 歌词语言选择器 */}
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-xs">🌐</span>
                            </div>
                            <select 
                                value={lyricsLanguage} 
                                onChange={(e) => {
                                    const lang = e.target.value as LyricsLanguage;
                                    setLyricsLanguage(lang);
                                    setLyricsLanguagePreference(lang);
                                }}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 pl-8 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer hover:border-slate-600 transition-colors"
                            >
                                {LYRICS_LANGUAGES.map(l => (
                                    <option key={l.code} value={l.code}>{l.flag} {l.nativeName}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-slate-400 text-base shrink-0">tag</span>
                        <input 
                            type="text" 
                            value={lyricPrompt}
                            onChange={(e) => setLyricPrompt(e.target.value)}
                            onKeyDown={handleLyricInputKeyDown}
                            placeholder={t('studio.promptPlaceholder')}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                        />
                        <button 
                            onClick={handleGenerateLyrics}
                            disabled={isGeneratingLyrics}
                            className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded text-xs font-bold transition-colors shadow-lg shadow-purple-900/50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                            {isGeneratingLyrics && <Loader2 className="w-3 h-3 animate-spin" />}
                            {isGeneratingLyrics ? t('studio.generating') : t('studio.generate')}
                        </button>
                    </div>
                    {lyricsError && (
                        <p className="text-[10px] text-red-400 flex items-center gap-1">
                            {lyricsError}
                            <button type="button" onClick={() => setLyricsError(null)} className="text-red-500 hover:text-red-300"><X className="w-3 h-3" /></button>
                        </p>
                    )}
                </div>
            </div>

            {/* Transport Bar */}
            <div className="h-24 bg-surface-dark border-t border-slate-800 flex items-center px-4 z-40 shadow-[0_-5px_15px_rgba(0,0,0,0.3)] shrink-0">
                <div className="flex flex-col gap-2 w-48 mr-6">
                    <div className="flex items-center justify-center gap-4">
                        <SkipBack 
                            className="w-6 h-6 text-slate-400 hover:text-white cursor-pointer" 
                            onClick={() => setCurrentTime(0)}
                        />
                        <button 
                            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-hover hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={togglePlayback}
                            disabled={!audioUrl}
                            title={audioUrl ? (isPlaying ? '暂停' : '播放') : '请先生成音频'}
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 fill-current ml-0.5" />
                            ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                        </button>
                        <SkipForward 
                            className="w-6 h-6 text-slate-400 hover:text-white cursor-pointer" 
                            onClick={() => setCurrentTime(duration)}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono bg-slate-800 rounded px-2 py-0.5">
                        <span className="text-primary">{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
                
                <div className="flex-1 h-full py-3 flex flex-col justify-center gap-2 border-l border-r border-slate-800 px-6">
                    <div className="flex justify-between items-end">
                        <div>
                            <h3 className="font-bold text-sm text-white">
                                {audioUrl ? (currentProject?.title || t('studio.untitled')) + ' — ' + (t('studio.generated') || '(已生成)') : 'Neon Cyber Dreams (v3)'}
                            </h3>
                            <p className="text-xs text-slate-500">
                                {audioTaskStatus === 'completed' && audioUrl
                                  ? '48kHz / 24bit • ' + (t('studio.clickToSeek') || '点击波形跳转')
                                  : audioTaskStatus === 'running'
                                    ? t('studio.generating') + '…'
                                    : 'Processing: 48kHz / 24bit • DolphinHeartMula-Pro'}
                            </p>
                        </div>
                    </div>
                    <div className="h-10 w-full bg-slate-900/50 rounded overflow-hidden flex items-end pb-1 px-1 relative group">
                        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 bg-white/5 pointer-events-none transition-opacity flex items-center justify-center">
                            <span className="text-[10px] text-white/50">{t('studio.clickToSeek')}</span>
                        </div>
                        <WaveformViz 
                            active={isPlaying} 
                            color="bg-primary" 
                            count={80} 
                            progress={currentTime / duration}
                            onScrub={handleScrub}
                        />
                    </div>
                </div>

                <div className="w-48 pl-6 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4 text-slate-500" />
                        <input type="range" className="flex-1 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary" />
                    </div>
                    <button
                        onClick={async () => {
                          if (!audioTaskId || !audioUrl) return;
                          try {
                            const r = await fetch(audioUrl);
                            const blob = await r.blob();
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = `generated-${audioTaskId}.mp3`;
                            a.click();
                            URL.revokeObjectURL(a.href);
                          } catch (e) {
                            console.error(e);
                            alert('导出失败');
                          }
                        }}
                        disabled={!audioTaskId || !audioUrl}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs flex items-center justify-center gap-1 transition-colors border border-slate-700 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         {t('studio.export')} <Download className="w-3 h-3 ml-1" />
                    </button>
                </div>
            </div>

        </main>

        {/* Task History Sidebar */}
        <aside className={`${showTaskHistory ? 'w-72' : 'w-10'} shrink-0 bg-surface-dark border-l border-slate-800 flex flex-col transition-all duration-200`}>
          <button
            onClick={() => setShowTaskHistory(!showTaskHistory)}
            className="h-10 flex items-center justify-center border-b border-slate-800 hover:bg-slate-800 transition-colors"
          >
            {showTaskHistory ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronLeft className="w-4 h-4 text-slate-400" />}
          </button>
          {showTaskHistory && (
            <>
              <div className="p-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-primary" /> {t('studio.taskHistory')}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loadingHistory ? (
                  <div className="p-4 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : taskHistory.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">{t('studio.noTasks')}</div>
                ) : (
                  <div className="p-2 space-y-1">
                    {taskHistory.map((task) => {
                      const params = task.params as { tags?: string } | undefined;
                      const isActive = audioTaskId === task.id;
                      return (
                        <button
                          key={task.id}
                          onClick={() => handleSelectHistoryTask(task)}
                          disabled={task.status !== 'completed'}
                          className={`w-full text-left p-2 rounded transition-colors ${isActive ? 'bg-primary/20 border border-primary/30' : 'hover:bg-slate-800 border border-transparent'} ${task.status !== 'completed' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-2">
                            {task.status === 'completed' ? (
                              <Play className="w-3 h-3 text-primary shrink-0" />
                            ) : task.status === 'running' ? (
                              <Loader2 className="w-3 h-3 animate-spin text-yellow-400 shrink-0" />
                            ) : task.status === 'failed' ? (
                              <X className="w-3 h-3 text-red-400 shrink-0" />
                            ) : (
                              <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-300 truncate">
                                {params?.tags || t('studio.untitledTask')}
                              </p>
                              <p className="text-[9px] text-slate-500">
                                {new Date(task.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

export default Studio;