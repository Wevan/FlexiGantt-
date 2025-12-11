import { ProjectFile, TaskRecord, FieldDefinition } from '../types';
import { DEFAULT_FIELDS, generateId } from '../constants';

// Initial Seed Data
const seedProjects: ProjectFile[] = [
  {
    id: 'proj_alpha',
    name: 'Website Redesign',
    team: 'Product Team',
    description: 'Q4 Overhaul of the marketing site',
    createdAt: new Date().toISOString(),
    fields: [...DEFAULT_FIELDS],
    tasks: [
      { id: 't1', f_name: 'Kickoff Meeting', f_owner: ['u1'], f_status: 'opt_done', f_start: '2023-10-01', f_end: '2023-10-01' },
      { id: 't2', f_name: 'Design Mockups', f_owner: ['u2'], f_status: 'opt_progress', f_start: '2023-10-02', f_end: '2023-10-10' },
      { id: 't3', f_name: 'Backend API', f_owner: ['u3'], f_status: 'opt_todo', f_start: '2023-10-05', f_end: '2023-10-15' },
      { id: 't4', f_name: 'Frontend Integration', f_owner: ['u1', 'u4'], f_status: 'opt_todo', f_start: '2023-10-12', f_end: '2023-10-25' },
      { id: 't5', f_name: 'QA Testing', f_owner: ['u2'], f_status: 'opt_todo', f_start: '2023-10-26', f_end: '2023-10-30' },
    ]
  }
];

class MockDB {
  private projects: ProjectFile[];

  constructor() {
    const stored = localStorage.getItem('flexigantt_projects_v2');
    if (stored) {
      this.projects = JSON.parse(stored);
      // Migration for old data if needed (optional simple check)
      this.projects.forEach(p => {
        if (!p.team) p.team = 'General';
      });
    } else {
      // Deep copy seed data to avoid referencing the module-level const
      this.projects = JSON.parse(JSON.stringify(seedProjects));
      this.save();
    }
  }

  private save() {
    localStorage.setItem('flexigantt_projects_v2', JSON.stringify(this.projects));
  }

  getProjects(): ProjectFile[] {
    // Return a shallow copy to ensure React state updates detect a new reference
    return [...this.projects];
  }

  getProject(id: string): ProjectFile | undefined {
    return this.projects.find(p => p.id === id);
  }

  createProject(name: string, team: string, description: string): ProjectFile {
    const newProject: ProjectFile = {
      id: generateId(),
      name,
      team: team || 'General',
      description,
      fields: JSON.parse(JSON.stringify(DEFAULT_FIELDS)), // Deep copy defaults
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    this.projects.push(newProject);
    this.save();
    return newProject;
  }

  deleteProject(id: string) {
    this.projects = this.projects.filter(p => p.id !== id);
    this.save();
  }

  addTask(projectId: string, task: TaskRecord) {
    const project = this.getProject(projectId);
    if (project) {
      project.tasks.push(task);
      this.save();
    }
  }

  updateTask(projectId: string, taskId: string, updates: Partial<TaskRecord>) {
    const project = this.getProject(projectId);
    if (project) {
      const taskIdx = project.tasks.findIndex(t => t.id === taskId);
      if (taskIdx !== -1) {
        project.tasks[taskIdx] = { ...project.tasks[taskIdx], ...updates };
        this.save();
      }
    }
  }

  deleteTask(projectId: string, taskId: string) {
    const project = this.getProject(projectId);
    if (project) {
        project.tasks = project.tasks.filter(t => t.id !== taskId);
        this.save();
    }
  }

  updateField(projectId: string, fieldId: string, updates: Partial<FieldDefinition>) {
    const project = this.getProject(projectId);
    if (project) {
        const idx = project.fields.findIndex(f => f.id === fieldId);
        if (idx !== -1) {
            project.fields[idx] = { ...project.fields[idx], ...updates };
            this.save();
        }
    }
  }
}

export const db = new MockDB();