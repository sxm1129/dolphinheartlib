import React from 'react';
import { ViewMode } from '../types';
import { 
  LayoutDashboard, 
  Music, 
  Library, 
  Heart, 
  Settings, 
  Disc3,
  LogOut,
  Languages
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

interface SidebarProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const { t, language, setLanguage } = useTranslation();

  const navItemClass = (active: boolean) => 
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${
      active 
        ? 'bg-primary/20 text-white border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <div className="w-64 flex-shrink-0 border-r border-slate-800 bg-[#0f1016] flex flex-col justify-between p-4 z-20 h-full">
      <div className="flex flex-col gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="bg-gradient-to-br from-primary to-purple-800 aspect-square rounded-xl size-10 flex items-center justify-center shadow-lg shadow-primary/20">
            <Music className="text-white w-6 h-6" />
          </div>
          <h1 className="text-white text-lg font-bold tracking-tight font-display">DolphinHeartMula</h1>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 mt-4">
          <div 
            className={navItemClass(currentView === ViewMode.LIBRARY)}
            onClick={() => onChangeView(ViewMode.LIBRARY)}
          >
            <LayoutDashboard className={`w-5 h-5 ${currentView === ViewMode.LIBRARY ? 'text-primary' : 'group-hover:text-primary'}`} />
            <span className="text-sm font-medium">{t('nav.library')}</span>
          </div>

          <div 
            className={navItemClass(currentView === ViewMode.STUDIO)}
            onClick={() => onChangeView(ViewMode.STUDIO)}
          >
            <Disc3 className={`w-5 h-5 ${currentView === ViewMode.STUDIO ? 'text-primary' : 'group-hover:text-primary'}`} />
            <span className="text-sm font-medium">{t('nav.studio')}</span>
          </div>

          <div 
            className={navItemClass(currentView === ViewMode.AUDIO_LAB)}
            onClick={() => onChangeView(ViewMode.AUDIO_LAB)}
          >
            <Library className={`w-5 h-5 ${currentView === ViewMode.AUDIO_LAB ? 'text-primary' : 'group-hover:text-primary'}`} />
            <span className="text-sm font-medium">{t('nav.audioLab')}</span>
          </div>

          <div
            className={`${navItemClass(false)} opacity-60 cursor-not-allowed`}
            title={t('lib.comingSoon')}
          >
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">{t('nav.favorites')}</span>
            <span className="text-[10px] text-slate-500 ml-auto">({t('lib.comingSoon')})</span>
          </div>
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-4">
        <div className="h-[1px] bg-slate-800 w-full"></div>
        
        <div 
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          onClick={toggleLanguage}
        >
          <Languages className="w-5 h-5" />
          <span className="text-sm font-medium flex-1">Language</span>
          <span className="text-xs font-bold px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">
             {language === 'en' ? 'EN' : '中'}
          </span>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">{t('nav.settings')}</span>
        </div>

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer bg-slate-900/50 border border-slate-800">
          <div className="size-8 rounded-full bg-slate-700 overflow-hidden border border-white/10">
            <img 
              alt="User Avatar" 
              className="w-full h-full object-cover" 
              src="https://picsum.photos/100/100" 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-sm font-medium">Alex D.</span>
            <span className="text-slate-500 text-xs">{t('user.pro')}</span>
          </div>
          <LogOut className="w-4 h-4 ml-auto text-slate-600 hover:text-white" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;