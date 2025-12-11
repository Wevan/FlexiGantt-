import React from 'react';
import { ProjectFile } from '../types';
import { Calendar, ArrowRight, Users, Trash2 } from 'lucide-react';

interface Props {
  project: ProjectFile;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

export const ProjectCard: React.FC<Props> = ({ project, onClick, onDelete }) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer flex flex-col justify-between h-44 relative group"
    >
      <button 
        onClick={(e) => {
            e.stopPropagation();
            onDelete(e);
        }}
        className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all border border-gray-100 z-10"
        title="Delete Project"
      >
        <Trash2 size={14} />
      </button>

      <div>
        <div className="flex items-center space-x-1.5 mb-2">
            <Users size={12} className="text-blue-500" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide truncate">{project.team}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2 truncate" title={project.name}>{project.name}</h3>
        <p className="text-gray-500 text-sm line-clamp-2">{project.description || "No description provided."}</p>
      </div>
      
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-4 text-gray-400 text-xs">
          <div className="flex items-center">
            <Calendar size={14} className="mr-1" />
            {project.tasks.length} tasks
          </div>
        </div>
        <button className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};