import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Project } from '../types';

interface ProjectContextValue {
  currentProject: Project | null;
  setCurrentProject: (p: Project | null) => void;
  currentProjectId: string | null;
  setCurrentProjectId: (id: string | null) => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

const STORAGE_KEY = 'dolphinheart_studio_current_project_id';

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [currentProjectId, setCurrentProjectIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setCurrentProject = (p: Project | null) => {
    setCurrentProjectState(p);
    setCurrentProjectIdState(p?.id ?? null);
    try {
      if (p?.id) localStorage.setItem(STORAGE_KEY, p.id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const setCurrentProjectId = (id: string | null) => {
    setCurrentProjectIdState(id);
    if (!id) setCurrentProjectState(null);
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        setCurrentProject,
        currentProjectId,
        setCurrentProjectId,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextValue => {
  const ctx = useContext(ProjectContext);
  if (ctx === undefined) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
};
