import React from 'react';
import { 
  SkipBack, Play, Square, Repeat, Sliders, Mic, Disc, Activity, Music, Download, Wand2
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const AudioLab: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#110f23] text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#29273a] bg-[#161425] px-6 py-3 shrink-0 z-20">
        <div className="flex items-center gap-4">
             <Activity className="w-6 h-6 text-primary" />
             <h2 className="text-xl font-bold tracking-tight font-display">DolphinHeartMula <span className="text-xs font-normal text-slate-400 opacity-60 ml-1">{t('lab.title')}</span></h2>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center bg-[#1e1c2e] rounded-lg px-3 py-1 border border-[#29273a] gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span className="text-xs font-mono">{t('lab.online')}</span>
           </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#1e1c2e] border-b border-[#29273a] shadow-sm shrink-0 z-10">
         <div className="flex items-center gap-2 text-sm text-[#9e9bbb]">
            <span>{t('lab.projects')}</span> <span className="material-symbols-rounded text-sm">chevron_right</span> <span className="text-white font-medium">{t('lab.clip')} #4022</span>
         </div>
         <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                 <button className="p-2 text-[#9e9bbb] hover:text-white transition-colors rounded-full hover:bg-[#29273a]"><SkipBack className="w-5 h-5" /></button>
                 <button className="p-2 text-white bg-primary hover:bg-primary/90 rounded-full transition-all shadow-[0_0_15px_rgba(27,6,249,0.4)]">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                 </button>
                 <button className="p-2 text-[#9e9bbb] hover:text-white transition-colors rounded-full hover:bg-[#29273a]"><Square className="w-4 h-4 fill-current" /></button>
                 <button className="p-2 text-primary hover:text-primary/80 transition-colors rounded-full hover:bg-[#29273a]"><Repeat className="w-5 h-5" /></button>
             </div>
             <div className="bg-black/40 px-4 py-2 rounded font-mono text-xl text-primary tracking-widest tabular-nums border border-[#29273a] shadow-inner">
                00:03:14:05
             </div>
         </div>
         <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#29273a] hover:bg-[#35334a] text-xs font-medium text-white transition-colors">
                <Sliders className="w-4 h-4" /> {t('lab.metronome')}
             </button>
             <div className="w-px h-8 bg-[#29273a]"></div>
             <div className="flex flex-col items-end">
                <span className="text-xs text-[#9e9bbb] uppercase tracking-wider">BPM</span>
                <span className="text-lg font-bold text-white leading-none">124</span>
             </div>
         </div>
      </div>

      <main className="flex-1 flex overflow-hidden">
         {/* Left Sidebar */}
         <aside className="w-72 bg-[#1e1c2e] border-r border-[#29273a] flex flex-col shrink-0 overflow-y-auto relative">
             <div className="px-5 py-4 border-b border-[#29273a]">
                <h3 className="text-xs font-bold text-[#9e9bbb] tracking-widest uppercase">{t('lab.stemSep')}</h3>
             </div>
             <div className="flex-1 p-4 space-y-4">
                 {[
                    { name: 'Vocals', icon: Mic, color: 'text-primary', db: '-3dB', val: 85 },
                    { name: 'Drums', icon: Disc, color: 'text-purple-400', db: '-1dB', val: 90 },
                    { name: 'Bass', icon: Activity, color: 'text-cyan-400', db: '-6dB', val: 70 },
                    { name: 'Other', icon: Music, color: 'text-orange-400', db: '-8dB', val: 60 }
                 ].map((track) => (
                    <div key={track.name} className="bg-[#161425] rounded-lg p-3 border border-[#29273a] relative overflow-hidden group">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <track.icon className={`w-4 h-4 ${track.color}`} />
                                <span className="text-sm font-medium">{track.name}</span>
                            </div>
                            <div className="flex gap-1">
                                <button className="w-6 h-6 text-[10px] font-bold bg-[#29273a] text-[#9e9bbb] hover:text-white rounded flex items-center justify-center">M</button>
                                <button className="w-6 h-6 text-[10px] font-bold bg-[#29273a] text-[#9e9bbb] hover:text-yellow-400 rounded flex items-center justify-center">S</button>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="range" className="w-full h-1 bg-[#29273a] rounded-lg appearance-none cursor-pointer" defaultValue={track.val} />
                            <span className="text-xs font-mono text-[#9e9bbb] w-8 text-right">{track.db}</span>
                        </div>
                    </div>
                 ))}
             </div>
             <div className="p-4 border-t border-[#29273a]">
                 <button className="w-full py-2 bg-[#29273a] hover:bg-primary/20 hover:text-primary text-[#9e9bbb] text-xs font-bold rounded uppercase tracking-wider transition-colors">
                    {t('lab.addStem')}
                 </button>
             </div>
         </aside>

         {/* Center Visualization */}
         <div className="flex-1 flex flex-col relative bg-[#110f23]">
             <section className="flex-1 relative border-b border-[#29273a] bg-[#161425] overflow-hidden flex flex-col items-center justify-center">
                 <div className="text-center mb-6 px-6">
                   <p className="text-slate-400 text-sm">{t('lab.comingSoonDesc')}</p>
                 </div>
                 {/* Grid Background */}
                 <div className="absolute inset-0 pointer-events-none" style={{backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 100px'}}></div>
                 
                 {/* Visualizer Placeholder */}
                 <div className="w-full px-10 h-64 flex items-center gap-1 opacity-90">
                    {Array.from({ length: 100 }).map((_, i) => (
                        <div 
                            key={i}
                            className={`flex-1 rounded-sm ${i > 35 && i < 65 ? 'bg-primary' : 'bg-primary/20'} transition-all duration-300`}
                            style={{
                                height: `${Math.random() * 80 + 10}%`
                            }}
                        />
                    ))}
                 </div>

                 {/* Playhead */}
                 <div className="absolute top-0 bottom-0 left-[50%] w-px bg-primary z-20 shadow-[0_0_10px_#1b06f9]"></div>
             </section>

             {/* Bottom Controls */}
             <section className="h-48 bg-[#110f23] p-6 flex gap-6">
                <div className="flex-1 flex flex-col justify-center">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                             <span className="w-2 h-2 rounded-full bg-primary"></span> {t('lab.promptInterp')}
                        </h3>
                        <span className="text-[10px] text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 flex gap-1 items-center font-bold">
                            <Wand2 className="w-3 h-3" /> {t('lab.aiActive')}
                        </span>
                     </div>
                     <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-[#9e9bbb] w-12 text-right">{t('lab.start')}</span>
                            <input type="text" className="w-full bg-[#1e1c2e] border border-[#29273a] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" defaultValue="Lofi hip hop beats, chill, rainy mood" />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-mono text-[#9e9bbb] w-12 text-right">{t('lab.end')}</span>
                            <input type="text" className="w-full bg-[#1e1c2e] border border-[#29273a] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" defaultValue="Synthwave, retro 80s, neon, driving" />
                        </div>
                     </div>
                </div>

                <div className="w-64 bg-[#161425] p-4 rounded border border-[#29273a] flex flex-col justify-between">
                    <div>
                         <h3 className="text-xs font-bold text-[#9e9bbb] tracking-widest uppercase mb-4">{t('studio.export')}</h3>
                         <div className="text-xs text-[#9e9bbb] mb-2 font-mono">{t('lab.exportFormat')}</div>
                    </div>
                    <button className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded shadow-[0_0_20px_rgba(27,6,249,0.3)] flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> {t('lab.exportMix')}
                    </button>
                </div>
             </section>
         </div>
      </main>
    </div>
  );
};

export default AudioLab;