import React, { useState, useEffect, useRef } from 'react';
import { 
  Undo, Redo, Play, Pause, SkipBack, SkipForward, 
  Mic, Volume2, Settings, Download, 
  Wand2, Music, Layers, Edit3, Share2, Loader2, History,
  Smile, Zap, Save, Plus, X, Check, Trash2, RotateCcw
} from 'lucide-react';
import WaveformViz from '../components/WaveformViz';
import { GoogleGenAI } from "@google/genai";
import { useTranslation } from '../contexts/LanguageContext';
import { generateAudio, getTask, getAudioUrl, pollTaskStatus, TaskResponse, uploadReferenceAudio, deleteUploadedFile, UploadResponse } from '../services/api';

const GENRES = ['Electronic', 'Pop', 'Rock', 'Hip Hop', 'R&B', 'Country', 'Jazz', 'Metal', 'Folk', 'Ambient'];
const MOODS = ['Dark', 'Happy', 'Sad', 'Energetic', 'Chill', 'Romantic', 'Nostalgic', 'Angry', 'Dreamy'];

interface GenPreset {
  id: string;
  name: string;
  checkpoint: string;
  temperature: number;
  topP: number;
  seamless: boolean;
}

const DEFAULT_PRESETS: GenPreset[] = [
  { id: 'p1', name: 'Balanced (Default)', checkpoint: 'HeartMula-Pro-4B (v2.1)', temperature: 0.85, topP: 0.9, seamless: false },
  { id: 'p2', name: 'High Creativity', checkpoint: 'HeartMula-Pro-4B (v2.1)', temperature: 1.1, topP: 0.95, seamless: false },
  { id: 'p3', name: 'Consistent Loop', checkpoint: 'HeartMula-Fast-2B', temperature: 0.7, topP: 0.8, seamless: true },
];

const Studio: React.FC = () => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  
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
  
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [lyricsHistory, setLyricsHistory] = useState<Array<{text: string, timestamp: Date}>>([]);
  const [showHistory, setShowHistory] = useState(false);

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

  // Gen Config & Preset State
  const [checkpoint, setCheckpoint] = useState('HeartMula-Pro-4B (v2.1)');
  const [temperature, setTemperature] = useState(0.85);
  const [topP, setTopP] = useState(0.9);
  const [seamless, setSeamless] = useState(false);

  const [presets, setPresets] = useState<GenPreset[]>(DEFAULT_PRESETS);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('p1');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Reference Audio Upload State
  const [refAudioFile, setRefAudioFile] = useState<UploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  const handleScrub = (progress: number) => {
    setCurrentTime(progress * duration);
  };

  const handleGenerateLyrics = async () => {
    if (isGeneratingLyrics) return;
    
    setIsGeneratingLyrics(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
        
        let promptContent = `Write creative song lyrics based on the following parameters:
        Genre: ${genre}
        Mood: ${mood}`;
        
        if (lyricPrompt.trim()) {
            promptContent += `\nTopic/Keywords: ${lyricPrompt}`;
        }
        
        promptContent += `\n\nFormat nicely with [Verse], [Chorus], etc. headers. Return only the lyrics.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: promptContent,
        });
        
        const text = response.text;
        if (text) {
            setLyricsHistory(prev => [{text, timestamp: new Date()}, ...prev]);
            setLyrics(text);
        }
    } catch (e) {
        console.error("Failed to generate lyrics", e);
    } finally {
        setIsGeneratingLyrics(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerateLyrics();
    }
  };

  // Preset Handlers
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
        setCheckpoint(preset.checkpoint);
        setTemperature(preset.temperature);
        setTopP(preset.topP);
        setSeamless(preset.seamless);
    }
  };

  const handleSavePreset = () => {
    if (!newPresetName.trim()) return;
    const newId = `custom-${Date.now()}`;
    const newPreset: GenPreset = {
        id: newId,
        name: newPresetName,
        checkpoint,
        temperature,
        topP,
        seamless
    };
    setPresets([...presets, newPreset]);
    setSelectedPresetId(newId);
    setShowSaveInput(false);
    setNewPresetName('');
  };

  const handleDeletePreset = (id: string) => {
    if (['p1', 'p2', 'p3'].includes(id)) return; // Protect defaults
    const newPresets = presets.filter(p => p.id !== id);
    setPresets(newPresets);
    if (selectedPresetId === id) {
        handlePresetChange('p1');
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
      // Create generation task
      const { task_id } = await generateAudio({
        lyrics: lyrics,
        tags: `${genre}, ${mood}`,
        temperature: temperature,
        topk: Math.round(topP * 100),  // Convert topP to topK approximation
        cfg_scale: 1.5,
        max_audio_length_ms: duration * 1000,
      });
      
      setAudioTaskId(task_id);
      setAudioTaskStatus('running');
      
      // Poll for completion
      const completedTask = await pollTaskStatus(
        task_id,
        (task) => {
          setAudioTaskStatus(task.status);
        }
      );
      
      if (completedTask.status === 'completed') {
        // Set the audio URL
        setAudioUrl(getAudioUrl(task_id));
        setAudioTaskStatus('completed');
      } else {
        setAudioError(completedTask.error_message || 'Generation failed');
        setAudioTaskStatus('failed');
      }
    } catch (error) {
      console.error('Audio generation failed:', error);
      setAudioError(error instanceof Error ? error.message : 'Unknown error');
      setAudioTaskStatus('failed');
    } finally {
      setIsGeneratingAudio(false);
    }
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

  // Reference Audio Upload Handlers
  const handleFileUpload = async (file: File) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/x-m4a', 'audio/aac'];
    const allowedExtensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac'];
    
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedExtensions.includes(ext) && !allowedTypes.includes(file.type)) {
      setUploadError('不支持的文件格式。请上传 MP3, WAV, FLAC, OGG 或 M4A 文件。');
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) {
      setUploadError('文件过大。最大支持 50MB。');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      const response = await uploadReferenceAudio(file);
      setRefAudioFile(response);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError(error instanceof Error ? error.message : '上传失败');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };
  
  const handleRemoveRefAudio = async () => {
    if (refAudioFile) {
      try {
        await deleteUploadedFile(refAudioFile.file_id);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
      setRefAudioFile(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-dark text-slate-200">
      
      {/* Top Bar */}
      <div className="h-14 border-b border-slate-800 bg-surface-dark flex items-center px-4 justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent font-bold text-lg font-display">
                Pro Studio
            </span>
            <span className="text-xs text-slate-500 border border-slate-700 rounded px-1">v2.1</span>
          </div>
          <div className="h-6 w-px bg-slate-700 mx-2"></div>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="material-symbols-rounded text-sm">folder_open</span>
            <span>{t('studio.untitled')}</span>
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
             
             <button className="flex items-center gap-1.5 bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-purple-900/30">
                <Share2 className="w-3 h-3" />
                {t('studio.share')}
             </button>

             <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-surface-dark flex items-center justify-center text-xs font-bold">S</div>
                <div className="w-7 h-7 rounded-full bg-pink-600 border-2 border-surface-dark flex items-center justify-center text-xs font-bold">A</div>
             </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Config Panel */}
        <aside className="w-72 bg-[#161b28] border-r border-slate-800 flex flex-col overflow-y-auto shrink-0 z-20 custom-scrollbar">
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
                            <select 
                                value={checkpoint}
                                onChange={(e) => setCheckpoint(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                            >
                                <option>HeartMula-Pro-4B (v2.1)</option>
                                <option>HeartMula-Fast-2B</option>
                                <option>HeartCodec-Studio-HQ</option>
                            </select>
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
                        
                        {/* Preset Manager */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-medium text-slate-400 uppercase">{t('studio.preset')}</label>
                                {!showSaveInput && (
                                    <button 
                                        onClick={() => setShowSaveInput(true)} 
                                        className="text-[10px] flex items-center gap-1 text-primary hover:text-white transition-colors"
                                    >
                                        <Save className="w-3 h-3" /> {t('studio.save')}
                                    </button>
                                )}
                            </div>

                            {showSaveInput ? (
                                <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                    <input 
                                        type="text" 
                                        value={newPresetName}
                                        onChange={(e) => setNewPresetName(e.target.value)}
                                        placeholder="Name..."
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-primary focus:outline-none"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
                                    />
                                    <button onClick={handleSavePreset} className="p-1 bg-primary text-white rounded hover:bg-primary-hover"><Check className="w-3 h-3" /></button>
                                    <button onClick={() => setShowSaveInput(false)} className="p-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"><X className="w-3 h-3" /></button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select 
                                        value={selectedPresetId} 
                                        onChange={(e) => handlePresetChange(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary outline-none appearance-none cursor-pointer"
                                    >
                                        {presets.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                    
                                    {!['p1', 'p2', 'p3'].includes(selectedPresetId) && (
                                        <button 
                                            onClick={() => handleDeletePreset(selectedPresetId)}
                                            className="w-full text-[10px] text-red-400 hover:text-red-300 flex items-center justify-center gap-1 border border-red-900/30 bg-red-900/10 rounded py-1 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" /> {t('studio.delete')}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="h-px bg-slate-800 w-full my-1"></div>

                        {/* Controls */}
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
                                <label className="text-[10px] uppercase text-slate-400">{t('studio.topP')}</label>
                                <span className="text-[10px] font-mono text-primary">{topP.toFixed(2)}</span>
                            </div>
                            <input 
                                type="range" 
                                min="0.1" max="1.0" step="0.05"
                                value={topP}
                                onChange={(e) => setTopP(parseFloat(e.target.value))}
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary" 
                            />
                        </div>

                         <div className="flex items-center gap-2 pt-2">
                            <input 
                                type="checkbox" 
                                id="seamless" 
                                checked={seamless}
                                onChange={(e) => setSeamless(e.target.checked)}
                                className="rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary h-3 w-3 cursor-pointer" 
                            />
                            <label htmlFor="seamless" className="text-xs text-slate-300 cursor-pointer select-none">{t('studio.seamless')}</label>
                        </div>
                    </div>
                </div>

                {/* Upload Zone */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".mp3,.wav,.flac,.ogg,.m4a,.aac"
                  className="hidden"
                />
                
                {refAudioFile ? (
                  // Uploaded file display
                  <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium text-slate-300">{t('studio.refAudio')}</h4>
                      <button 
                        onClick={handleRemoveRefAudio}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-2">
                      <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                        <Music className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{refAudioFile.filename}</p>
                        <p className="text-[10px] text-slate-500">{(refAudioFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                ) : (
                  // Upload dropzone
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`border border-dashed rounded-lg p-4 text-center transition-all cursor-pointer group ${
                      isDragging 
                        ? 'border-primary bg-primary/10' 
                        : 'border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:border-slate-600'
                    }`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 mx-auto text-primary mb-2 animate-spin" />
                        <h4 className="text-xs font-medium text-slate-300">上传中...</h4>
                      </>
                    ) : (
                      <>
                        <Download className={`w-6 h-6 mx-auto mb-2 ${isDragging ? 'text-primary' : 'text-slate-500 group-hover:text-primary'}`} />
                        <h4 className="text-xs font-medium text-slate-300">{t('studio.refAudio')}</h4>
                        <p className="text-[10px] text-slate-500 mt-1">{t('studio.dropAudio')}</p>
                        {uploadError && (
                          <p className="text-[10px] text-red-400 mt-2">{uploadError}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
            </div>

            <div className="mt-auto p-4 border-t border-slate-800 bg-surface-dark">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                    <span>{t('studio.vram')}</span>
                    <span className="text-slate-300">14.2 / 24 GB</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-blue-500 h-1.5 rounded-full" style={{width: '60%'}}></div>
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
                        <div className="flex-1 relative">
                            <textarea 
                                className="w-full h-full bg-transparent p-6 outline-none font-mono text-sm leading-relaxed resize-none text-slate-300 placeholder-slate-600 focus:ring-0 border-0"
                                value={lyrics}
                                onChange={(e) => setLyrics(e.target.value)}
                            />
                            
                            {/* Prompt Bar Overlay */}
                            <div className="absolute bottom-4 left-4 right-4 bg-slate-800/95 backdrop-blur border border-slate-600 rounded-lg p-3 shadow-xl z-20 flex flex-col gap-3">
                                <div className="flex gap-2">
                                     {/* Genre Select */}
                                     <div className="relative flex-1 group">
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

                                     {/* Mood Select */}
                                     <div className="relative flex-1 group">
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
                                </div>

                                <div className="flex items-center gap-2 border-t border-slate-700/50 pt-2">
                                    <span className="material-symbols-rounded text-slate-400 pl-1 text-base">tag</span>
                                    <input 
                                        type="text" 
                                        value={lyricPrompt}
                                        onChange={(e) => setLyricPrompt(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={t('studio.promptPlaceholder')}
                                        className="bg-transparent border-0 focus:ring-0 text-xs sm:text-sm text-white w-full placeholder-slate-500 p-0"
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
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom: Timeline / Tracks */}
                <div className="flex-1 bg-[#13161f] flex flex-col relative">
                    <div className="h-8 bg-surface-dark border-b border-slate-800 flex items-center px-2 shadow-sm z-10">
                        <span className="text-[10px] font-bold text-slate-500 w-24 pl-2">{t('studio.tracks')}</span>
                        <div className="flex-1 flex justify-between px-2 text-[9px] font-mono text-slate-600 select-none">
                            <span>00:00</span><span>00:15</span><span>00:30</span><span>00:45</span><span>01:00</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative waveform-container">
                        {/* Track 1: Vocals */}
                        <div className="h-24 border-b border-slate-800 flex group relative hover:bg-white/5 transition-colors">
                            <div className="w-24 bg-surface-dark border-r border-slate-800 p-2 flex flex-col justify-center gap-1 shrink-0 z-10">
                                <div className="text-xs font-medium text-slate-300 flex gap-1 items-center"><Mic className="w-3 h-3 text-purple-400" /> {t('studio.vocals')}</div>
                                <div className="flex gap-1">
                                    <button className="text-[9px] bg-slate-700 text-slate-400 px-1 rounded hover:text-white">M</button>
                                    <button className="text-[9px] bg-slate-700 text-slate-400 px-1 rounded hover:text-white">S</button>
                                </div>
                            </div>
                            <div className="flex-1 relative py-2 px-1">
                                <div className="absolute left-0 top-2 bottom-2 w-[45%] bg-purple-500/20 border border-purple-500/40 rounded ml-2 overflow-hidden">
                                     <div className="w-full h-full opacity-70 px-1 py-4">
                                        <WaveformViz color="bg-purple-400" count={40} />
                                     </div>
                                     <div className="absolute top-1 left-2 text-[9px] font-bold text-purple-300">{t('studio.verse1')} {t('studio.generated')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Track 2: Instrumental */}
                        <div className="h-24 border-b border-slate-800 flex group relative hover:bg-white/5 transition-colors">
                            <div className="w-24 bg-surface-dark border-r border-slate-800 p-2 flex flex-col justify-center gap-1 shrink-0 z-10">
                                <div className="text-xs font-medium text-slate-300 flex gap-1 items-center"><Music className="w-3 h-3 text-blue-400" /> {t('studio.instr')}</div>
                                <div className="flex gap-1">
                                    <button className="text-[9px] bg-slate-700 text-slate-400 px-1 rounded hover:text-white">M</button>
                                    <button className="text-[9px] bg-slate-700 text-slate-400 px-1 rounded hover:text-white">S</button>
                                </div>
                            </div>
                            <div className="flex-1 relative py-2 px-1">
                                <div className="absolute left-0 top-2 bottom-2 w-[45%] bg-blue-500/20 border border-blue-500/40 rounded ml-2 overflow-hidden flex items-center justify-center">
                                     <div className="opacity-50">
                                        <Layers className="w-6 h-6 text-blue-400" />
                                     </div>
                                     <div className="absolute top-1 left-2 text-[9px] font-bold text-blue-300">{t('studio.backing')}</div>
                                </div>
                                {/* Playhead Line */}
                                <div className="absolute top-0 bottom-0 left-[20%] w-px bg-red-500 z-0 pointer-events-none">
                                    <div className="w-3 h-3 -ml-1.5 bg-red-500 rotate-45 transform -mt-1.5 shadow-sm"></div>
                                </div>
                            </div>
                        </div>
                    </div>
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
                            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary-hover hover:scale-105 transition-all"
                            onClick={() => setIsPlaying(!isPlaying)}
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
                            <h3 className="font-bold text-sm text-white">Neon Cyber Dreams (v3)</h3>
                            <p className="text-xs text-slate-500">Processing: 48kHz / 24bit • DolphinHeartMula-Pro</p>
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
                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded text-xs flex items-center justify-center gap-1 transition-colors border border-slate-700 w-full">
                         {t('studio.export')} <Download className="w-3 h-3 ml-1" />
                    </button>
                </div>
            </div>

        </main>
      </div>
    </div>
  );
};

export default Studio;