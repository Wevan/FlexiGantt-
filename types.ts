export type FieldType = 'text' | 'date' | 'select';

export interface FieldOption {
  id: string;
  label: string;
  color: string; // Hex code
}

export interface FieldDefinition {
  id: string;
  name: string;
  type: FieldType;
  options?: FieldOption[]; // Only for 'select'
  isMulti?: boolean; // If true, allows selecting multiple options
  isSystem?: boolean; // Cannot be deleted if true (e.g., Name)
}

// A flexible record where keys are field IDs
export interface TaskRecord {
  id: string;
  [fieldId: string]: any;
}

export interface ProjectFile {
  id: string;
  name: string;
  team: string; // Added for group/team categorization
  description?: string;
  createdAt: string;
  fields: FieldDefinition[];
  tasks: TaskRecord[];
}

export type ViewMode = 'table' | 'gantt';