import React, { useState } from 'react';
import { ProjectFile, TaskRecord, FieldDefinition, FieldOption } from '../types';
import { Plus, X, Settings, Filter, Check, ChevronDown } from 'lucide-react';

interface Props {
  project: ProjectFile;
  filters: Record<string, string[]>;
  onUpdateTask: (taskId: string, fieldId: string, value: any) => void;
  onAddTask: () => void;
  onDeleteTask: (taskId: string) => void;
  onEditField: (field: FieldDefinition) => void;
  onUpdateFilter: (fieldId: string, value: string[]) => void;
}

export const TableView: React.FC<Props> = ({ 
  project, 
  filters,
  onUpdateTask, 
  onAddTask, 
  onDeleteTask,
  onEditField,
  onUpdateFilter
}) => {
  const [activeMenuField, setActiveMenuField] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<{ taskId: string; fieldId: string; rect: DOMRect } | null>(null);

  // Filter the tasks before rendering
  const visibleTasks = project.tasks.filter(task => {
    return Object.entries(filters).every(([fieldId, val]) => {
      const filterValues = val as string[];
      if (!filterValues || filterValues.length === 0) return true;
      const cellValue = task[fieldId];
      if (Array.isArray(cellValue)) {
        return cellValue.some(v => filterValues.includes(v));
      }
      return filterValues.includes(cellValue);
    });
  });

  const renderCell = (task: TaskRecord, field: FieldDefinition) => {
    const value = task[field.id];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onUpdateTask(task.id, field.id, e.target.value)}
            className="w-full h-full px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
            placeholder=""
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onUpdateTask(task.id, field.id, e.target.value)}
            className="w-full h-full px-3 py-2 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm text-gray-600 font-medium"
          />
        );
      case 'select':
        // Unified handling for both multi and single select to ensure consistent UI (Pills)
        const isMulti = field.isMulti;
        const selectedIds = Array.isArray(value) ? value : (value ? [value] : []);
        
        return (
             <div className="relative w-full h-full group">
                <div 
                    className="flex flex-wrap gap-1 px-2 items-center h-full w-full overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setEditingCell({ taskId: task.id, fieldId: field.id, rect });
                    }}
                >
                    {selectedIds.length === 0 && (
                        <span className="text-gray-300 text-sm group-hover:text-gray-400 flex items-center">
                            Select <ChevronDown size={12} className="ml-1 opacity-50" />
                        </span>
                    )}
                    {selectedIds.map((id: string) => {
                        const opt = field.options?.find(o => o.id === id);
                        if (!opt) return null;
                        return (
                            <span 
                                key={id} 
                                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border shadow-sm whitespace-nowrap" 
                                style={{ 
                                    backgroundColor: opt.color + '20', // 20% opacity
                                    color: 'black', // Darker text for contrast
                                    borderColor: opt.color + '40'
                                }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: opt.color }}></span>
                                {opt.label}
                            </span>
                        );
                    })}
                </div>
             </div>
         );
      default:
        return null;
    }
  };

  return (
    <div 
        className="flex-1 overflow-auto bg-white pb-20 custom-scrollbar"
        onScroll={() => {
            if (editingCell) setEditingCell(null);
        }}
    >
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50 sticky top-0 z-20 shadow-sm">
          <tr>
            {project.fields.map((field) => (
              <th
                key={field.id}
                className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-r border-gray-200 min-w-[160px] relative group select-none"
              >
                <div className="flex items-center justify-between">
                    <span className="truncate">{field.name}</span>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            onClick={() => setActiveMenuField(activeMenuField === field.id ? null : field.id)}
                            className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters[field.id]?.length ? 'text-blue-600 bg-blue-50 opacity-100' : 'text-gray-400'}`}
                        >
                            <Filter size={14} />
                        </button>
                        {field.type === 'select' && (
                            <button 
                                onClick={() => onEditField(field)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-400 transition-colors"
                            >
                                <Settings size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {activeMenuField === field.id && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-3 flex flex-col">
                        <div className="text-xs font-bold text-gray-500 mb-2 uppercase">Filter by {field.name}</div>
                        {field.type === 'select' && field.options ? (
                            <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar">
                                {field.options.map(opt => {
                                    const isActive = filters[field.id]?.includes(opt.id);
                                    return (
                                        <div 
                                            key={opt.id} 
                                            className={`flex items-center px-2 py-1.5 rounded cursor-pointer text-sm ${isActive ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-700'}`}
                                            onClick={() => {
                                                const current = filters[field.id] || [];
                                                const next = isActive 
                                                    ? current.filter(c => c !== opt.id)
                                                    : [...current, opt.id];
                                                onUpdateFilter(field.id, next);
                                            }}
                                        >
                                            <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${isActive ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                 {isActive && <Check size={10} className="text-white" />}
                                            </div>
                                            <span className="truncate">{opt.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                             <div className="text-xs text-gray-400 italic p-2 border border-dashed rounded bg-gray-50">Text filtering coming soon.</div>
                        )}
                        <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                             <button 
                                onClick={() => setActiveMenuField(null)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
                             >
                                 Done
                             </button>
                        </div>
                    </div>
                )}
              </th>
            ))}
            <th className="w-12 border-b border-gray-200 bg-gray-50"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {visibleTasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-50 group transition-colors">
              {project.fields.map((field) => (
                <td
                  key={`${task.id}-${field.id}`}
                  className="p-0 border-r border-gray-100 h-11 relative focus-within:bg-blue-50/30"
                >
                  {renderCell(task, field)}
                </td>
              ))}
              <td className="px-2 text-center h-11 border-b border-gray-100">
                  <button 
                    onClick={() => onDeleteTask(task.id)}
                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete task"
                  >
                      <X size={14} />
                  </button>
              </td>
            </tr>
          ))}
          
          {/* Add Row Button */}
          <tr>
            <td colSpan={project.fields.length + 1} className="p-0">
                <button 
                    onClick={onAddTask}
                    className="flex items-center text-gray-400 hover:text-blue-600 text-sm font-medium transition-colors px-4 py-3 hover:bg-gray-50 w-full text-left"
                >
                    <Plus size={16} className="mr-2" />
                    New Task
                </button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Dropdown Portal */}
      {editingCell && (() => {
           const field = project.fields.find(f => f.id === editingCell.fieldId);
           const task = project.tasks.find(t => t.id === editingCell.taskId);
           
           if (!field || !task || !field.options) return null;

           const value = task[field.id];
           const selectedIds = Array.isArray(value) ? value : (value ? [value] : []);
           const isMulti = field.isMulti;

           return (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setEditingCell(null)}></div>
                 <div 
                    className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl p-1.5 flex flex-col gap-0.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
                    style={{ 
                        top: editingCell.rect.bottom + 4, 
                        left: editingCell.rect.left,
                        minWidth: Math.max(editingCell.rect.width, 220) 
                    }}
                 >
                    {field.options.map(opt => {
                         const isSelected = selectedIds.includes(opt.id);
                         return (
                            <div 
                                key={opt.id}
                                className={`flex items-center px-2 py-1.5 rounded cursor-pointer select-none transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    let next;
                                    if (isMulti) {
                                        next = isSelected 
                                            ? selectedIds.filter((id: string) => id !== opt.id)
                                            : [...selectedIds, opt.id];
                                    } else {
                                        // Single select mode: clicking selected deselects it, otherwise sets it
                                        next = isSelected ? '' : opt.id; 
                                        setEditingCell(null); // Close on selection for single mode
                                    }
                                    onUpdateTask(task.id, field.id, next);
                                }}
                            >
                                <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                    {isSelected && <Check size={10} className="text-white" />}
                                </div>
                                <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: opt.color }}></div>
                                <span className={`text-sm ${isSelected ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{opt.label}</span>
                            </div>
                         );
                    })}
                    {field.options.length === 0 && <div className="p-2 text-xs text-gray-400">No options defined</div>}
                 </div>
               </>
           );
      })()}
    </div>
  );
};