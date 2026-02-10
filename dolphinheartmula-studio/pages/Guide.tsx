import React from 'react';
import {
    BookOpen, Rocket, Music, Tag, Sliders, Mic, FolderOpen,
    Keyboard, Share2, Lightbulb, ChevronRight, Sparkles,
    FileText, Wand2, Volume2, Download
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const Guide: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#110f23] text-white">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-[#29273a] bg-[#161425] px-6 py-4 shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/20 flex items-center justify-center border border-primary/20">
                        <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight font-display">{t('guide.title')}</h1>
                        <p className="text-xs text-slate-400 mt-0.5">{t('guide.subtitle')}</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

                    {/* Platform Overview */}
                    <Section icon={<Sparkles className="w-5 h-5" />} title={t('guide.overview')} accent="from-blue-500 to-cyan-400">
                        <p className="text-slate-300 leading-relaxed">{t('guide.overviewDesc')}</p>
                    </Section>

                    {/* Quick Start */}
                    <Section icon={<Rocket className="w-5 h-5" />} title={t('guide.quickStart')} accent="from-green-400 to-emerald-500">
                        <p className="text-slate-400 text-sm mb-5">{t('guide.quickStartDesc')}</p>
                        <div className="space-y-3">
                            <StepCard step="1" icon={<FolderOpen className="w-4 h-4" />} title={t('guide.step1Title')} desc={t('guide.step1Desc')} />
                            <StepCard step="2" icon={<Music className="w-4 h-4" />} title={t('guide.step2Title')} desc={t('guide.step2Desc')} />
                            <StepCard step="3" icon={<FileText className="w-4 h-4" />} title={t('guide.step3Title')} desc={t('guide.step3Desc')} />
                            <StepCard step="4" icon={<Tag className="w-4 h-4" />} title={t('guide.step4Title')} desc={t('guide.step4Desc')} />
                            <StepCard step="5" icon={<Sliders className="w-4 h-4" />} title={t('guide.step5Title')} desc={t('guide.step5Desc')} />
                            <StepCard step="6" icon={<Wand2 className="w-4 h-4" />} title={t('guide.step6Title')} desc={t('guide.step6Desc')} />
                            <StepCard step="7" icon={<Volume2 className="w-4 h-4" />} title={t('guide.step7Title')} desc={t('guide.step7Desc')} />
                        </div>
                    </Section>

                    {/* Music Generation (Detailed) */}
                    <Section icon={<Music className="w-5 h-5" />} title={t('guide.musicGen')} accent="from-primary to-purple-500">
                        <p className="text-slate-400 text-sm mb-6">{t('guide.musicGenDesc')}</p>

                        {/* Lyrics */}
                        <SubSection icon={<FileText className="w-4 h-4" />} title={t('guide.lyricsSection')}>
                            <p className="text-slate-300 text-sm mb-3">{t('guide.lyricsDesc')}</p>
                            <div className="bg-black/30 rounded-lg p-4 border border-[#29273a] font-mono text-sm space-y-1">
                                <CodeLine tag="[Intro]" desc="Instrumental intro" />
                                <CodeLine tag="[Verse]" desc="Storytelling verses" />
                                <CodeLine tag="[Prechorus]" desc="Build-up to chorus" />
                                <CodeLine tag="[Chorus]" desc="Main hook (repeatable)" />
                                <CodeLine tag="[Bridge]" desc="Emotional contrast" />
                                <CodeLine tag="[Outro]" desc="Closing" />
                            </div>
                        </SubSection>

                        {/* AI Lyrics */}
                        <SubSection icon={<Wand2 className="w-4 h-4" />} title={t('guide.lyricsAI')}>
                            <p className="text-slate-300 text-sm">{t('guide.lyricsAIDesc')}</p>
                        </SubSection>

                        {/* Tags */}
                        <SubSection icon={<Tag className="w-4 h-4" />} title={t('guide.tagsSection')}>
                            <p className="text-slate-300 text-sm mb-3">{t('guide.tagsDesc')}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <TagGroup emoji="🎭" label="Emotion / Atmosphere" examples="warm, sad, hopeful, energetic" />
                                <TagGroup emoji="🎸" label="Genre / Style" examples="pop, R&B, electronic, rock, ballad" />
                                <TagGroup emoji="🎹" label="Instruments" examples="piano, guitar, strings, drums" />
                                <TagGroup emoji="🎤" label="Scene / Vocal" examples="wedding, male vocal, female vocal" />
                            </div>
                        </SubSection>

                        {/* Generation Parameters */}
                        <SubSection icon={<Sliders className="w-4 h-4" />} title={t('guide.paramsSection')}>
                            <p className="text-slate-300 text-sm mb-3">{t('guide.paramsDesc')}</p>
                            <div className="space-y-2">
                                <ParamRow label="Temperature" value="0.1 - 1.5" defaultVal="0.85" desc={t('guide.paramTemp')} />
                                <ParamRow label="Top-K" value="1 - 200" defaultVal="50" desc={t('guide.paramTopK')} />
                                <ParamRow label="Max Length" value="ms" defaultVal="240000" desc={t('guide.paramLength')} />
                                <ParamRow label="CFG Scale" value="1.0 - 3.0" defaultVal="1.5" desc={t('guide.paramCfg')} />
                            </div>
                        </SubSection>

                        {/* Lyrics Format */}
                        <SubSection icon={<FileText className="w-4 h-4" />} title={t('guide.lyricsFormat')}>
                            <p className="text-slate-300 text-sm mb-2">{t('guide.lyricsFormatDesc')}</p>
                            <div className="bg-black/30 rounded-lg p-3 border border-[#29273a] font-mono text-xs text-primary/80">
                                piano,happy,wedding,synthesizer,romantic
                            </div>
                        </SubSection>
                    </Section>

                    {/* Transcribe */}
                    <Section icon={<Mic className="w-5 h-5" />} title={t('guide.transcribeSection')} accent="from-orange-400 to-amber-500">
                        <p className="text-slate-300 leading-relaxed">{t('guide.transcribeDesc')}</p>
                    </Section>

                    {/* Project Management */}
                    <Section icon={<FolderOpen className="w-5 h-5" />} title={t('guide.projectSection')} accent="from-teal-400 to-cyan-500">
                        <p className="text-slate-300 leading-relaxed">{t('guide.projectDesc')}</p>
                    </Section>

                    {/* Keyboard Shortcuts */}
                    <Section icon={<Keyboard className="w-5 h-5" />} title={t('guide.shortcutsSection')} accent="from-pink-400 to-rose-500">
                        <div className="space-y-2">
                            <ShortcutRow keys={['Space']} desc={t('guide.shortcutSpace')} />
                            <ShortcutRow keys={['\u2318/Ctrl', 'Enter']} desc={t('guide.shortcutCmdEnter')} />
                        </div>
                    </Section>

                    {/* Sharing */}
                    <Section icon={<Share2 className="w-5 h-5" />} title={t('guide.shareSection')} accent="from-violet-400 to-purple-500">
                        <p className="text-slate-300 leading-relaxed">{t('guide.shareDesc')}</p>
                    </Section>

                    {/* Tips */}
                    <Section icon={<Lightbulb className="w-5 h-5" />} title={t('guide.tipsSection')} accent="from-yellow-400 to-orange-400">
                        <ul className="space-y-3">
                            {[t('guide.tip1'), t('guide.tip2'), t('guide.tip3'), t('guide.tip4'), t('guide.tip5')].map((tip, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <span className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </Section>

                    {/* Footer spacer */}
                    <div className="h-8" />
                </div>
            </main>
        </div>
    );
};

/* ---- Sub-components ---- */

function Section({ icon, title, accent, children }: { icon: React.ReactNode; title: string; accent: string; children: React.ReactNode }) {
    return (
        <section className="bg-[#161425] rounded-2xl border border-[#29273a] overflow-hidden">
            <div className={`flex items-center gap-3 px-6 py-4 border-b border-[#29273a] bg-gradient-to-r ${accent} bg-clip-text`}>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${accent} bg-opacity-20 flex items-center justify-center text-white/90`}>
                    {icon}
                </div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
            </div>
            <div className="px-6 py-5">
                {children}
            </div>
        </section>
    );
}

function SubSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
    return (
        <div className="mb-6 last:mb-0">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-primary/70">{icon}</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function StepCard({ step, icon, title, desc }: { step: string; icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="flex items-start gap-4 bg-[#1e1c2e] rounded-xl p-4 border border-[#29273a] hover:border-primary/30 transition-colors group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                {icon}
            </div>
            <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function CodeLine({ tag, desc }: { tag: string; desc: string }) {
    return (
        <div className="flex items-center gap-3">
            <span className="text-primary font-bold">{tag}</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-400">{desc}</span>
        </div>
    );
}

function TagGroup({ emoji, label, examples }: { emoji: string; label: string; examples: string }) {
    return (
        <div className="bg-[#1e1c2e] rounded-lg p-3 border border-[#29273a]">
            <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{emoji}</span>
                <span className="text-xs font-bold text-white">{label}</span>
            </div>
            <p className="text-xs text-slate-400">{examples}</p>
        </div>
    );
}

function ParamRow({ label, value, defaultVal, desc }: { label: string; value: string; defaultVal: string; desc: string }) {
    return (
        <div className="bg-[#1e1c2e] rounded-lg p-3 border border-[#29273a]">
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white font-mono">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">{value}</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">default: {defaultVal}</span>
                </div>
            </div>
            <p className="text-xs text-slate-400">{desc}</p>
        </div>
    );
}

function ShortcutRow({ keys, desc }: { keys: string[]; desc: string }) {
    return (
        <div className="flex items-center gap-3 bg-[#1e1c2e] rounded-lg p-3 border border-[#29273a]">
            <div className="flex items-center gap-1.5">
                {keys.map((k, i) => (
                    <React.Fragment key={k}>
                        {i > 0 && <span className="text-slate-600 text-xs">+</span>}
                        <kbd className="px-2 py-1 bg-black/40 rounded text-xs font-mono text-primary border border-[#29273a]">{k}</kbd>
                    </React.Fragment>
                ))}
            </div>
            <span className="text-sm text-slate-300">{desc}</span>
        </div>
    );
}

export default Guide;
