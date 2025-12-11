import { FieldDefinition } from './types';

export const COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#64748b', // slate
  '#94a3b8', // gray
];

// System fields that every new project starts with
export const DEFAULT_FIELDS: FieldDefinition[] = [
  { id: 'f_name', name: 'Task Name', type: 'text', isSystem: true },
  { 
    id: 'f_owner', 
    name: 'Owner', 
    type: 'select', 
    isMulti: true, // Allow multiple owners
    isSystem: false,
    options: [
      { id: 'u1', label: 'Alice Chen', color: '#3b82f6' },
      { id: 'u2', label: 'Bob Smith', color: '#ef4444' },
      { id: 'u3', label: 'Charlie Kim', color: '#22c55e' },
      { id: 'u4', label: 'Diana Prince', color: '#eab308' },
    ]
  },
  { 
    id: 'f_status', 
    name: 'Status', 
    type: 'select', 
    isMulti: false,
    options: [
      { id: 'opt_todo', label: 'To Do', color: '#94a3b8' },
      { id: 'opt_progress', label: 'In Progress', color: '#3b82f6' },
      { id: 'opt_done', label: 'Done', color: '#22c55e' }
    ] 
  },
  { id: 'f_start', name: 'Start Date', type: 'date' },
  { id: 'f_end', name: 'End Date', type: 'date' },
];

export const generateId = () => Math.random().toString(36).substr(2, 9);
