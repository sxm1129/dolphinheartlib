import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Library from './pages/Library';
import Studio from './pages/Studio';
import Transcribe from './pages/Transcribe';
import AudioLab from './pages/AudioLab';
import Share from './pages/Share';
import { ViewMode } from './types';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { ToastProvider } from './components/Toast';

// Simple path-based routing for share pages
const getShareIdFromPath = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/^\/share\/([a-zA-Z0-9-]+)$/);
  return match ? match[1] : null;
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.LIBRARY);
  const [shareId, setShareId] = useState<string | null>(null);

  useEffect(() => {
    const id = getShareIdFromPath();
    setShareId(id);
  }, []);

  // If on a share page, render Share component
  if (shareId) {
    return <Share shareId={shareId} />;
  }

  const renderContent = () => {
    switch (currentView) {
      case ViewMode.LIBRARY:
        return <Library setCurrentView={setCurrentView} />;
      case ViewMode.STUDIO:
        return <Studio />;
      case ViewMode.TRANSCRIBE:
        return <Transcribe />;
      case ViewMode.AUDIO_LAB:
        return <AudioLab />;
      default:
        return <Library setCurrentView={setCurrentView} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background-dark text-slate-200 font-sans selection:bg-primary/30">
      {currentView !== ViewMode.AUDIO_LAB && (
        <Sidebar currentView={currentView} onChangeView={setCurrentView} />
      )}
      
      {currentView === ViewMode.AUDIO_LAB && (
          <div className="absolute top-4 left-4 z-50">
             <button 
                onClick={() => setCurrentView(ViewMode.LIBRARY)}
                className="w-32 h-8 absolute px-3 py-1.5 rounded bg-surface-darker border border-[#374151] text-slate-300 hover:text-white hover:bg-[#374151] transition-colors"
             >Back</button>
          </div>
      )}

      <div className="flex-1 flex flex-col h-full relative">
        {renderContent()}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <ProjectProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </ProjectProvider>
    </LanguageProvider>
  );
};

export default App;