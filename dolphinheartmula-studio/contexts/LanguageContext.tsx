import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'zh';

const translations = {
  en: {
    nav: {
      library: 'Library',
      studio: 'Studio',
      audioLab: 'Audio Lab',
      favorites: 'Favorites',
      settings: 'Settings',
    },
    user: {
      pro: 'Pro Plan',
    },
    lib: {
      title: 'Project Library',
      desc: 'Manage and organize your AI-generated soundscapes',
      new: 'Create New Project',
      search: 'Search by name, tags, or style...',
      allModels: 'All Models',
      dateCreated: 'Date Created',
      loading: 'Loading projects...',
    },
    studio: {
      compose: 'Compose',
      mastering: 'Mastering',
      share: 'Share',
      untitled: 'Untitled Project 4',
      live: 'Live',
      modelConfig: 'Model Config',
      checkpoint: 'Checkpoint',
      genSettings: 'Gen Settings',
      preset: 'Preset',
      save: 'Save',
      delete: 'Delete Preset',
      creativity: 'Creativity (Temp)',
      topP: 'Top-P',
      seamless: 'Seamless Loop',
      refAudio: 'Reference Audio',
      dropAudio: 'Drop audio to guide style (MP3/WAV)',
      vram: 'VRAM Usage',
      lyricEditor: 'LYRIC EDITOR',
      history: 'History',
      close: 'Close',
      genHistory: 'Generation History',
      noLyrics: 'No generated lyrics yet.',
      revert: 'Revert',
      aiSuggest: 'AI Suggest',
      tokens: 'Tokens',
      genre: 'Genre',
      mood: 'Mood',
      promptPlaceholder: 'Specific keywords, topics, or story elements...',
      generate: 'GENERATE',
      generating: 'GENERATING...',
      tracks: 'TRACKS',
      vocals: 'Vocals',
      instr: 'Instr.',
      backing: 'Backing Track',
      verse1: 'Verse 1',
      generated: '(Generated)',
      addSection: '+ Section',
      bpm: 'BPM',
      key: 'Key',
      export: 'Export',
      clickToSeek: 'Click to seek',
    },
    lab: {
      title: 'AUDIO LAB',
      online: 'ONLINE',
      projects: 'Projects',
      clip: 'Clip',
      metronome: 'METRONOME',
      stemSep: 'Stem Separation',
      addStem: '+ Add Stem',
      promptInterp: 'Prompt Interpolation',
      aiActive: 'AI ACTIVE',
      start: 'START',
      end: 'END',
      exportMix: 'Export Mix',
      exportFormat: 'WAV (32-bit float) • 48kHz',
      comingSoon: 'Coming Soon',
      comingSoonDesc: 'Stem separation feature is under development. Stay tuned!',
    }
  },
  zh: {
    nav: {
      library: '项目库',
      studio: '工作室',
      audioLab: '音频实验室',
      favorites: '收藏',
      settings: '设置',
    },
    user: {
      pro: '专业版',
    },
    lib: {
      title: '项目库',
      desc: '管理和组织您的 AI 生成音景',
      new: '新建项目',
      search: '按名称、标签或风格搜索...',
      allModels: '所有模型',
      dateCreated: '创建日期',
      loading: '正在加载项目...',
    },
    studio: {
      compose: '作曲',
      mastering: '母带',
      share: '分享',
      untitled: '未命名项目 4',
      live: '实时',
      modelConfig: '模型配置',
      checkpoint: '检查点',
      genSettings: '生成设置',
      preset: '预设',
      save: '保存',
      delete: '删除预设',
      creativity: '创意度 (Temp)',
      topP: 'Top-P 采样',
      seamless: '无缝循环',
      refAudio: '参考音频',
      dropAudio: '拖放音频以引导风格 (MP3/WAV)',
      vram: '显存使用',
      lyricEditor: '歌词编辑器',
      history: '历史',
      close: '关闭',
      genHistory: '生成历史',
      noLyrics: '暂无生成歌词。',
      revert: '恢复',
      aiSuggest: 'AI 建议',
      tokens: 'Token数',
      genre: '流派',
      mood: '情绪',
      promptPlaceholder: '特定关键词、主题或故事元素...',
      generate: '生成',
      generating: '生成中...',
      tracks: '轨道',
      vocals: '人声',
      instr: '器乐',
      backing: '伴奏',
      verse1: '第一节',
      generated: '(已生成)',
      addSection: '+ 章节',
      bpm: 'BPM',
      key: '调式',
      export: '导出',
      clickToSeek: '点击跳转',
    },
    lab: {
      title: '音频实验室',
      online: '在线',
      projects: '项目',
      clip: '剪辑',
      metronome: '节拍器',
      stemSep: '分轨分离',
      addStem: '+ 添加分轨',
      promptInterp: '提示词插值',
      aiActive: 'AI 激活',
      start: '开始',
      end: '结束',
      exportMix: '导出混音',
      exportFormat: 'WAV (32-bit float) • 48kHz',
      comingSoon: '即将推出',
      comingSoonDesc: '分轨分离功能正在开发中，敬请期待！',
    }
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      if (value && value[k]) {
        value = value[k];
      } else {
        return key;
      }
    }
    return value as string;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
