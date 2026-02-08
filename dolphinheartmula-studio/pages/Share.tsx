import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Music, ArrowLeft, Eye, Clock } from 'lucide-react';
import { getShare, getShareAudioUrl, ShareDetailResponse } from '../services/api';

interface ShareProps {
  shareId: string;
}

const Share: React.FC<ShareProps> = ({ shareId }) => {
  const [shareData, setShareData] = useState<ShareDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!shareId) return;
    setLoading(true);
    getShare(shareId)
      .then(setShareData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [shareId]);

  useEffect(() => {
    if (shareData?.task?.output_audio_path) {
      const audio = new Audio(getShareAudioUrl(shareData.task.id));
      audioRef.current = audio;
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      return () => {
        audio.pause();
        audio.src = '';
      };
    }
  }, [shareData]);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-background-dark flex flex-col items-center justify-center gap-4">
        <div className="text-red-400">{error || '分享不存在'}</div>
        <a href="/" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> 返回首页
        </a>
      </div>
    );
  }

  const { task } = shareData;
  const lyrics = task?.params?.lyrics || '';
  const tags = task?.params?.tags || '';

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-gradient-to-br from-background-dark via-[#1a1f2e] to-[#0d1117] text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-surface-dark/50 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center">
              <Music className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-lg bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              HeartMula
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {shareData.view_count} 次播放
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {new Date(shareData.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <h1 className="text-3xl font-bold font-display mb-8 text-center">
          {shareData.title || 'AI 生成的音乐'}
        </h1>

        {/* Audio Player Card */}
        <div className="bg-surface-dark rounded-2xl border border-slate-800 p-8 mb-8 shadow-xl">
          {/* Waveform placeholder */}
          <div className="h-24 bg-slate-900 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center gap-0.5 px-8">
              {Array.from({ length: 60 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all ${currentTime / duration > i / 60 ? 'bg-primary' : 'bg-slate-700'}`}
                  style={{ height: `${20 + Math.sin(i * 0.3) * 15 + Math.random() * 20}px` }}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-6">
            <span className="text-slate-500 text-sm min-w-[40px]">{formatTime(currentTime)}</span>
            <button
              onClick={togglePlayback}
              className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-900/30 hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            <span className="text-slate-500 text-sm min-w-[40px]">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Lyrics */}
          {lyrics && (
            <div className="bg-surface-dark rounded-xl border border-slate-800 p-6 flex flex-col min-h-0">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 shrink-0">歌词</h2>
              <pre className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed font-mono overflow-y-auto max-h-64 pr-2">
                {lyrics}
              </pre>
            </div>
          )}

          {/* Tags */}
          {tags && (
            <div className="bg-surface-dark rounded-xl border border-slate-800 p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">风格标签</h2>
              <div className="flex flex-wrap gap-2">
                {tags.split(',').map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-slate-800 rounded-full text-sm text-slate-300"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-500 rounded-full text-white font-bold hover:shadow-lg hover:shadow-purple-900/30 transition-shadow"
          >
            <Music className="w-5 h-5" />
            创建你自己的音乐
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-500 text-sm">
          Powered by <span className="text-primary">HeartMula</span> AI Music Generation
        </div>
      </footer>
    </div>
  );
};

export default Share;
