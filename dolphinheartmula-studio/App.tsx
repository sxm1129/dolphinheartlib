import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Library from './pages/Library';
import Studio from './pages/Studio';
import Transcribe from './pages/Transcribe';
import Share from './pages/Share';
import Login from './pages/Login';
import { ViewMode } from './types';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { PageStateProvider } from './contexts/PageStateContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';

// Simple path-based routing for share pages
const getShareIdFromPath = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/^\/share\/([a-zA-Z0-9-]+)$/);
  return match ? match[1] : null;
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.LIBRARY);
  const [shareId, setShareId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  useEffect(() => {
    const id = getShareIdFromPath();
    setShareId(id);
  }, []);

  // If on a share page, render Share component (public access)
  if (shareId) {
    return <Share shareId={shareId} />;
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background-dark text-slate-200">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <Login />;
  }

  // Page state preservation (two layers):
  // 1. Keep all main views mounted and only hide inactive ones (CSS). This preserves in-memory state when switching pages (lyrics, audio, form fields).
  // 2. Pages can opt-in to usePageStateSlice(viewId, key, initial, { persist: true }) for sessionStorage so state survives page refresh (see PageStateContext).
  const viewContainerClass = 'flex-1 flex flex-col h-full min-h-0 relative';
  const hiddenClass = 'hidden';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background-dark text-slate-200 font-sans selection:bg-primary/30">
      <div
        className={`flex-shrink-0 h-full border-r border-slate-800 bg-[#0f1016] overflow-hidden transition-[width] duration-200 ease-out z-20 ${sidebarOpen ? 'w-64' : 'w-[4.5rem]'}`}
      >
        <Sidebar
          currentView={currentView}
          onChangeView={setCurrentView}
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((v) => !v)}
        />
      </div>

      <div className="flex-1 flex flex-col h-full relative min-w-0">
        <div className={currentView === ViewMode.LIBRARY ? viewContainerClass : hiddenClass}>
          <Library setCurrentView={setCurrentView} />
        </div>
        <div className={currentView === ViewMode.STUDIO ? viewContainerClass : hiddenClass}>
          <Studio />
        </div>
        <div className={currentView === ViewMode.TRANSCRIBE ? viewContainerClass : hiddenClass}>
          <Transcribe />
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ProjectProvider>
        <PageStateProvider>
          <AuthProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </AuthProvider>
        </PageStateProvider>
      </ProjectProvider>
    </LanguageProvider>
  );
};

export default App;