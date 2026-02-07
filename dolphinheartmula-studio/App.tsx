import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Library from './pages/Library';
import Studio from './pages/Studio';
import AudioLab from './pages/AudioLab';
import { ViewMode } from './types';
import { LanguageProvider } from './contexts/LanguageContext';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.LIBRARY);

  const renderContent = () => {
    switch (currentView) {
      case ViewMode.LIBRARY:
        return <Library />;
      case ViewMode.STUDIO:
        return <Studio />;
      case ViewMode.AUDIO_LAB:
        return <AudioLab />;
      default:
        return <Library />;
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
                className="opacity-0 w-32 h-8 absolute"
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
      <AppContent />
    </LanguageProvider>
  );
};

export default App;