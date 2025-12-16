import { ProjectFile, TaskRecord, FieldDefinition } from '../types';
import { DEFAULT_FIELDS, generateId } from '../constants';

const API_URL = 'http://localhost:8000';

class ApiDB {
  
  async getProjects(): Promise<ProjectFile[]> {
    try {
      const res = await fetch(`${API_URL}/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      return await res.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  async getProject(id: string): Promise<ProjectFile | undefined> {
    try {
      const res = await fetch(`${API_URL}/projects/${id}`);
      if (res.status === 404) return undefined;
      return await res.json();
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  async createProject(name: string, team: string, description: string): Promise<ProjectFile> {
    const newProject: ProjectFile = {
      id: generateId(),
      name,
      team: team || 'General',
      description,
      fields: JSON.parse(JSON.stringify(DEFAULT_FIELDS)), // Client-side generation of defaults
      tasks: [],
      createdAt: new Date().toISOString(),
    };

    const res = await fetch(`${API_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject),
    });

    if (!res.ok) throw new Error('Failed to create project');
    return await res.json();
  }

  async deleteProject(id: string): Promise<void> {
    await fetch(`${API_URL}/projects/${id}`, { method: 'DELETE' });
  }

  async addTask(projectId: string, task: TaskRecord): Promise<void> {
    await fetch(`${API_URL}/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task }),
    });
  }

  async updateTask(projectId: string, taskId: string, updates: Partial<TaskRecord>): Promise<void> {
    await fetch(`${API_URL}/projects/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    await fetch(`${API_URL}/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  async updateField(projectId: string, fieldId: string, updates: Partial<FieldDefinition>): Promise<void> {
    // Backend expects { options: [...] } specifically for this implementation based on App usage
    if (updates.options) {
      await fetch(`${API_URL}/projects/${projectId}/fields/${fieldId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options: updates.options }),
      });
    }
  }
}

export const db = new ApiDB();