import React, { useEffect, useState } from 'react';
import { Project } from '../types';
import { fetchProjects, createProject, deleteProject, ProjectListResponse } from '../services/api';
import WaveformViz from '../components/WaveformViz';
import { Play, MoreVertical, Search, Calendar, Filter, Grid, List, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';

const Library: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectGenre, setNewProjectGenre] = useState('Electronic');
  const [creating, setCreating] = useState(false);
  const { t } = useTranslation();

  const GENRES = ['Electronic', 'Pop', 'Rock', 'Hip Hop', 'R&B', 'Jazz', 'Ambient', 'Lo-Fi'];

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response: ProjectListResponse = await fetchProjects({
        search: searchQuery || undefined,
        genre: selectedGenre || undefined,
      });
      // Normalize date field names
      const normalized = response.items.map(p => ({
        ...p,
        createdAt: p.created_at || p.createdAt || '',
      }));
      setProjects(normalized);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [searchQuery, selectedGenre]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCreateProject = async () => {
    if (!newProjectTitle.trim()) return;
    
    setCreating(true);
    try {
      await createProject({
        title: newProjectTitle,
        genre: newProjectGenre,
        tags: [],
      });
      setNewProjectTitle('');
      setShowNewModal(false);
      loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('确定要删除这个项目吗？')) return;
    
    try {
      await deleteProject(id);
      loadProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-background-dark">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="flex-shrink-0 px-8 py-6 z-10 border-b border-slate-800 bg-[#110f23]/80 backdrop-blur-md">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1 font-display">{t('lib.title')}</h2>
            <p className="text-slate-400 text-sm">{t('lib.desc')}</p>
          </div>
          <button 
            onClick={() => setShowNewModal(true)}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-purple-900/25 flex items-center gap-2 transition-all transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            {t('lib.new')}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-500 group-focus-within:text-primary transition-colors" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearch}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-700/50 rounded-lg bg-[#1c1a2e] text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-[#25223a] focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-sm transition-all" 
              placeholder={t('lib.search')} 
            />
          </div>

          <div className="flex items-center gap-2">
             <select 
               value={selectedGenre || ''}
               onChange={(e) => setSelectedGenre(e.target.value || null)}
               className="flex items-center gap-2 px-3 py-2 bg-[#1c1a2e] border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-[#25223a] hover:text-white transition-colors"
             >
                <option value="">{t('lib.allModels')}</option>
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
             </select>
             <button className="flex items-center gap-2 px-3 py-2 bg-[#1c1a2e] border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-[#25223a] hover:text-white transition-colors">
                <Calendar className="w-4 h-4" />
                <span>{t('lib.dateCreated')}</span>
             </button>
             <div className="h-6 w-[1px] bg-slate-700 mx-2"></div>
             <div className="flex bg-[#1c1a2e] rounded-lg border border-slate-700/50 p-1">
                <button className="p-1.5 text-slate-400 hover:text-white rounded"><List className="w-4 h-4" /></button>
                <button className="p-1.5 bg-slate-700 text-white rounded shadow-sm"><Grid className="w-4 h-4" /></button>
             </div>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="flex-1 overflow-y-auto p-8 z-10">
        {loading ? (
            <div className="flex justify-center items-center h-64 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              {t('lib.loading')}
            </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            {projects.map((project) => (
              <div key={project.id} className="bg-[#1c1a2e]/70 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden group hover:border-primary/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 relative flex flex-col">
                {/* Visual Header */}
                <div className={`h-40 relative p-4 flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800`}>
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[1px] cursor-pointer">
                      <button className="bg-primary text-white rounded-full p-3 shadow-lg hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 fill-current pl-1" />
                      </button>
                   </div>
                   <WaveformViz color={project.color?.replace('bg-', 'bg-') || 'bg-primary'} />
                   
                   {/* Status Badge */}
                   <div className="absolute top-3 right-3 z-0">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${
                        project.status === 'Mastered' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        project.status === 'Generated' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-slate-500/10 text-slate-400 border-slate-500/20'
                      }`}>
                        {project.status}
                      </span>
                   </div>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                   <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-bold text-lg truncate pr-2 font-display">{project.title}</h3>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="text-slate-500 hover:text-white">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </div>
                   </div>
                   
                   <div className="flex flex-wrap gap-2 mb-4">
                      {project.genre && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-purple-200 border border-primary/20 uppercase tracking-wide">
                          {project.genre}
                        </span>
                      )}
                      {project.tags?.map(tag => (
                        <span key={tag} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700/50 text-slate-300 border border-slate-600/50 uppercase tracking-wide">
                            {tag}
                        </span>
                      ))}
                   </div>

                   <div className="mt-auto flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-3">
                      <div className="flex items-center gap-1">
                         <span className="material-symbols-rounded text-sm">schedule</span>
                         <span>{project.duration || '--:--'}</span>
                      </div>
                      <span>{formatDate(project.createdAt || project.created_at)}</span>
                   </div>
                </div>
              </div>
            ))}
            
            {/* Add New Placeholder */}
            <div 
              onClick={() => setShowNewModal(true)}
              className="border border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center p-8 gap-4 text-slate-500 hover:text-white hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group min-h-[280px]"
            >
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <Plus className="w-8 h-8" />
                </div>
                <span className="font-medium">{t('lib.new')}</span>
            </div>
          </div>
        )}
      </main>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#1c1a2e] border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">新建项目</h3>
              <button 
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">项目名称</label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="输入项目名称..."
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">音乐类型</label>
                <select
                  value={newProjectGenre}
                  onChange={(e) => setNewProjectGenre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={creating || !newProjectTitle.trim()}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;