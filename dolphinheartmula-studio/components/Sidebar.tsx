import React, { useState } from 'react';
import { ViewMode } from '../types';
import { 
  LayoutDashboard, 
  Music, 
  Heart, 
  Disc3,
  Mic,
  LogOut,
  LogIn,
  Languages,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

interface SidebarProps {
  currentView: ViewMode;
  onChangeView: (view: ViewMode) => void;
  open?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, open = true, onToggle }) => {
  const { t, language, setLanguage } = useTranslation();
  const { user, logout, clearError } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navItemClass = (active: boolean) =>
    active
      ? 'bg-primary/20 text-white border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
      : 'text-slate-400 hover:text-white hover:bg-white/5';

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const iconOnly = !open;
  const itemBaseClass = 'flex items-center rounded-lg transition-all duration-200 cursor-pointer group border border-transparent';

  return (
    <>
    <div className={`flex flex-col justify-between h-full ${iconOnly ? 'w-[4.5rem] p-2' : 'w-64 min-w-[16rem] p-4'}`}>
      <div className="flex flex-col gap-6">
        {/* Brand + collapse/expand */}
        <div className={`flex items-center ${iconOnly ? 'justify-center flex-col gap-2' : 'justify-between gap-2'}`}>
          <div className={`flex items-center min-w-0 ${iconOnly ? 'justify-center' : 'gap-3 px-2'}`}>
            <div className="bg-gradient-to-br from-primary to-purple-800 aspect-square rounded-xl size-10 flex-shrink-0 flex items-center justify-center shadow-lg shadow-primary/20">
              <Music className="text-white w-6 h-6" />
            </div>
            {!iconOnly && <h1 className="text-white text-lg font-bold tracking-tight font-display truncate">DolphinHeartMula</h1>}
          </div>
          {onToggle && (
            <button
              type="button"
              onClick={onToggle}
              className={`rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 ${iconOnly ? 'p-2' : 'p-1.5'}`}
              title={open ? '收起侧边栏' : '展开侧边栏'}
            >
              {open ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex flex-col gap-2 mt-4 ${iconOnly ? 'items-center' : ''}`}>
          <div
            className={`${itemBaseClass} ${navItemClass(currentView === ViewMode.LIBRARY)} ${iconOnly ? 'p-2.5 justify-center' : 'gap-3 px-3 py-2.5'}`}
            onClick={() => onChangeView(ViewMode.LIBRARY)}
            title={iconOnly ? t('nav.library') : undefined}
          >
            <LayoutDashboard className={`w-5 h-5 flex-shrink-0 ${currentView === ViewMode.LIBRARY ? 'text-primary' : 'group-hover:text-primary'}`} />
            {!iconOnly && <span className="text-sm font-medium">{t('nav.library')}</span>}
          </div>

          <div
            className={`${itemBaseClass} ${navItemClass(currentView === ViewMode.STUDIO)} ${iconOnly ? 'p-2.5 justify-center' : 'gap-3 px-3 py-2.5'}`}
            onClick={() => onChangeView(ViewMode.STUDIO)}
            title={iconOnly ? t('nav.studio') : undefined}
          >
            <Disc3 className={`w-5 h-5 flex-shrink-0 ${currentView === ViewMode.STUDIO ? 'text-primary' : 'group-hover:text-primary'}`} />
            {!iconOnly && <span className="text-sm font-medium">{t('nav.studio')}</span>}
          </div>

          <div
            className={`${itemBaseClass} ${navItemClass(currentView === ViewMode.TRANSCRIBE)} ${iconOnly ? 'p-2.5 justify-center' : 'gap-3 px-3 py-2.5'}`}
            onClick={() => onChangeView(ViewMode.TRANSCRIBE)}
            title={iconOnly ? t('nav.transcribe') : undefined}
          >
            <Mic className={`w-5 h-5 flex-shrink-0 ${currentView === ViewMode.TRANSCRIBE ? 'text-primary' : 'group-hover:text-primary'}`} />
            {!iconOnly && <span className="text-sm font-medium">{t('nav.transcribe')}</span>}
          </div>

          <div
            className={`hidden ${itemBaseClass} opacity-60 cursor-not-allowed ${iconOnly ? 'p-2.5 justify-center' : 'gap-3 px-3 py-2.5'}`}
            title={t('lib.comingSoon')}
          >
            <Heart className="w-5 h-5 flex-shrink-0" />
            {!iconOnly && (
              <>
                <span className="text-sm font-medium">{t('nav.favorites')}</span>
                <span className="text-[10px] text-slate-500 ml-auto">({t('lib.comingSoon')})</span>
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Bottom: language + user */}
      <div className={`flex flex-col gap-4 ${iconOnly ? 'items-center' : ''}`}>
        <div className="h-[1px] bg-slate-800 w-full" />

        <div
          className={`flex items-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer ${iconOnly ? 'p-2.5 justify-center' : 'gap-3 px-3 py-2'}`}
          onClick={toggleLanguage}
          title={iconOnly ? (language === 'en' ? 'EN' : '中') : undefined}
        >
          <Languages className="w-5 h-5 flex-shrink-0" />
          {!iconOnly && (
            <>
              <span className="text-sm font-medium flex-1">Language</span>
              <span className="text-xs font-bold px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">{language === 'en' ? 'EN' : '中'}</span>
            </>
          )}
        </div>

        {user ? (
          <button
            type="button"
            onClick={() => logout()}
            className={`flex items-center rounded-lg hover:bg-white/5 cursor-pointer bg-slate-900/50 border border-slate-800 w-full ${iconOnly ? 'p-2 justify-center' : 'gap-3 px-3 py-2'}`}
            title={iconOnly ? t('nav.logout') || '退出' : undefined}
          >
            <div className="size-8 rounded-full bg-slate-700 overflow-hidden border border-white/10 flex-shrink-0 flex items-center justify-center text-white text-sm font-medium">
              {(user.display_name || user.username).slice(0, 1).toUpperCase()}
            </div>
            {!iconOnly && (
              <>
                <div className="flex flex-col min-w-0 flex-1 text-left">
                  <span className="text-white text-sm font-medium truncate">{user.display_name || user.username}</span>
                  <span className="text-slate-500 text-xs">{user.plan}</span>
                </div>
                <LogOut className="w-4 h-4 shrink-0 text-slate-600 hover:text-white" />
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className={`flex items-center rounded-lg hover:bg-white/5 cursor-pointer bg-slate-900/50 border border-slate-800 w-full ${iconOnly ? 'p-2 justify-center' : 'gap-3 px-3 py-2'}`}
            title={iconOnly ? (t('nav.login') || '登录') : undefined}
          >
            <LogIn className="w-5 h-5 shrink-0 text-slate-400" />
            {!iconOnly && <span className="text-sm font-medium text-slate-300">{t('nav.login') || '登录'}</span>}
          </button>
        )}
      </div>
    </div>
    {showLoginModal && <LoginModal onClose={() => { setShowLoginModal(false); clearError(); }} />}
    </>
  );
};

export default Sidebar;