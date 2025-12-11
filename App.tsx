import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import { ProjectFile, TaskRecord, ViewMode, FieldDefinition, FieldOption } from './types';
import { generateId, DEFAULT_FIELDS, COLORS } from './constants';
import { ProjectCard } from './components/ProjectCard';
import { TableView } from './components/TableView';
import { GanttView } from './components/GanttView';
import { 
  Layout, Calendar, Plus, ChevronLeft, Trash2, X, Check, Users
} from 'lucide-react';

const App: React.FC = () => {
  // --- Global State ---
  const [projects, setProjects] = useState<ProjectFile[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectFile | null>(null);
  
  // --- View State ---
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // --- Filter State: { fieldId: [value1, value2] } ---
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  // --- Modal State ---
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTeam, setNewProjectTeam] = useState('');

  // --- Field Settings Modal State ---
  const [editingField, setEditingField] = useState<FieldDefinition | null>(null);
  const [tempOptions, setTempOptions] = useState<FieldOption[]>([]);
  const [newOptionLabel, setNewOptionLabel] = useState('');

  // --- Effects ---
  useEffect(() => {
    setProjects(db.getProjects());
  }, []);

  const refreshProject = (id: string) => {
      const p = db.getProject(id);
      if (p) setActiveProject({...p}); 
      setProjects(db.getProjects());
  };

  // --- Project Handlers ---

  const handleCreateProject = () => {
      if (!newProjectName.trim()) return;
      // Use entered team or default to 'General'
      const team = newProjectTeam.trim() || 'General';
      const newP = db.createProject(newProjectName, team, 'New project space');
      setProjects(db.getProjects());
      setActiveProject(newP);
      setIsNewProjectModalOpen(false);
      setNewProjectName('');
      setNewProjectTeam('');
      setActiveFilters({});
      setViewMode('table');
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); // Stop click from propagating to the card
      if (window.confirm('Are you sure you want to delete this project?')) {
          db.deleteProject(id);
          setProjects(db.getProjects());
          if (activeProject?.id === id) setActiveProject(null);
      }
  };

  // --- Task Handlers ---

  const handleUpdateTask = (taskId: string, fieldId: string, value: any) => {
      if (!activeProject) return;
      db.updateTask(activeProject.id, taskId, { [fieldId]: value });
      refreshProject(activeProject.id);
  };

  const handleAddTask = () => {
      if (!activeProject) return;
      const newTask: TaskRecord = { id: generateId() };
      db.addTask(activeProject.id, newTask);
      refreshProject(activeProject.id);
  };

  const handleDeleteTask = (taskId: string) => {
      if (!activeProject) return;
      db.deleteTask(activeProject.id, taskId);
      refreshProject(activeProject.id);
  };

  // --- Field Settings Handlers ---

  const openFieldSettings = (field: FieldDefinition) => {
      setEditingField(field);
      setTempOptions(field.options ? [...field.options] : []);
  };

  const handleSaveFieldSettings = () => {
      if (activeProject && editingField) {
          db.updateField(activeProject.id, editingField.id, { options: tempOptions });
          setEditingField(null);
          refreshProject(activeProject.id);
      }
  };

  const handleAddOption = () => {
      if (!newOptionLabel.trim()) return;
      const newOpt: FieldOption = {
          id: generateId(),
          label: newOptionLabel,
          color: COLORS[Math.floor(Math.random() * COLORS.length)]
      };
      setTempOptions([...tempOptions, newOpt]);
      setNewOptionLabel('');
  };

  const handleRemoveOption = (optId: string) => {
      setTempOptions(tempOptions.filter(o => o.id !== optId));
  };

  // --- Render ---

  // Group projects by team for the dashboard
  const projectsByTeam = projects.reduce((acc, project) => {
      const team = project.team || 'General';
      if (!acc[team]) acc[team] = [];
      acc[team].push(project);
      return acc;
  }, {} as Record<string, ProjectFile[]>);

  // Sort teams alphabetically
  const sortedTeams = Object.keys(projectsByTeam).sort();

  // 1. Dashboard View
  if (!activeProject) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
        <header className="bg-white border-b border-gray-200 py-4 px-6 mb-8 flex-none sticky top-0 z-10 shadow-sm">
            <div className="max-w-6xl mx-auto flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                        <Layout size={20} />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight text-gray-900">FlexiGantt Team</h1>
                </div>
                <button 
                    onClick={() => setIsNewProjectModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium flex items-center text-sm shadow-sm"
                >
                    <Plus size={16} className="mr-2" />
                    New Project
                </button>
            </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 w-full flex-1 pb-20">
            {projects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Layout size={32} />
                    </div>
                    <p className="text-gray-500 mb-4 font-medium">No project files yet.</p>
                    <button onClick={() => setIsNewProjectModalOpen(true)} className="text-blue-600 hover:text-blue-800 font-semibold">Create your first project</button>
                </div>
            ) : (
                <div className="space-y-10">
                    {sortedTeams.map(team => (
                        <div key={team}>
                             <div className="flex items-center mb-4">
                                <Users size={20} className="text-gray-400 mr-2" />
                                <h2 className="text-lg font-bold text-gray-800">{team}</h2>
                                <span className="ml-3 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{projectsByTeam[team].length}</span>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projectsByTeam[team].map(p => (
                                    <ProjectCard 
                                      key={p.id} 
                                      project={p} 
                                      onClick={() => { setActiveProject(p); setActiveFilters({}); }}
                                      onDelete={(e) => handleDeleteProject(e, p.id)}
                                    />
                                ))}
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </main>

        {/* Create Project Modal */}
        {isNewProjectModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-96 transform transition-all scale-100">
                    <h3 className="text-lg font-bold mb-4 text-gray-800">Create Project File</h3>
                    
                    <div className="mb-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Project Name</label>
                        <input 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. Website Launch"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Team / Group</label>
                        <input 
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. Marketing"
                            value={newProjectTeam}
                            onChange={(e) => setNewProjectTeam(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsNewProjectModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                        <button onClick={handleCreateProject} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">Create</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // 2. Project Workspace View
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden text-gray-900 font-sans">
        
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white flex-none z-30 shadow-sm relative">
            <div className="flex items-center space-x-4">
                <button onClick={() => setActiveProject(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <div className="flex items-center">
                        <h1 className="font-bold text-gray-800 leading-tight mr-2">{activeProject.name}</h1>
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">{activeProject.team}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                         <span>{activeProject.tasks.length} tasks</span>
                         <span className="mx-1">•</span>
                         <span>Last edited just now</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <Layout size={14} className="mr-2" />
                        Table
                    </button>
                    <button 
                        onClick={() => setViewMode('gantt')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center transition-all ${viewMode === 'gantt' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                    >
                        <Calendar size={14} className="mr-2" />
                        Gantt
                    </button>
                </div>
                
                {Object.values(activeFilters).some(v => v && v.length > 0) && (
                     <button 
                        onClick={() => setActiveFilters({})}
                        className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md font-medium transition-colors ml-2"
                     >
                         Clear {Object.values(activeFilters).flat().length} Filters
                     </button>
                )}
            </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col relative z-0">
            {viewMode === 'table' ? (
                <TableView 
                    project={activeProject} 
                    filters={activeFilters}
                    onAddTask={handleAddTask} 
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onEditField={openFieldSettings}
                    onUpdateFilter={(fid, vals) => setActiveFilters(prev => ({...prev, [fid]: vals}))}
                />
            ) : (
                <GanttView 
                    project={activeProject}
                    filters={activeFilters}
                />
            )}
        </div>

        {/* Field Settings Modal */}
        {editingField && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-96 max-h-[85vh] flex flex-col transform transition-all scale-100">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Edit Options</h3>
                            <p className="text-xs text-gray-500">Field: {editingField.name}</p>
                        </div>
                        <button onClick={() => setEditingField(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 rounded-lg bg-gray-50 p-2 space-y-2 custom-scrollbar">
                        {tempOptions.map(opt => (
                            <div key={opt.id} className="flex items-center justify-between bg-white p-2.5 rounded-md shadow-sm border border-gray-100 group">
                                <div className="flex items-center">
                                    <div className="w-5 h-5 rounded-full mr-3 shadow-inner ring-1 ring-black/5" style={{ backgroundColor: opt.color }} />
                                    <span className="text-sm font-medium text-gray-700">{opt.label}</span>
                                </div>
                                <button onClick={() => handleRemoveOption(opt.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                        {tempOptions.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <div className="mb-2 opacity-50"><Layout size={24} /></div>
                                <span className="text-sm">No options defined.</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-2 mb-4 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <input 
                            className="flex-1 bg-transparent px-2 py-1.5 text-sm focus:outline-none"
                            placeholder="Type new option..."
                            value={newOptionLabel}
                            onChange={(e) => setNewOptionLabel(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                        />
                        <button 
                            onClick={handleAddOption} 
                            disabled={!newOptionLabel.trim()}
                            className="bg-white hover:bg-gray-100 text-blue-600 p-1.5 rounded-md shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    <button 
                        onClick={handleSaveFieldSettings} 
                        className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        )}

    </div>
  );
};

export default App;