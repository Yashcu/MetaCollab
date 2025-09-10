import api from './api';
import { Project } from '@/types';

type CreateProjectData = Omit<Project, 'id' | 'members' | 'tasks' | 'owner'>;

export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get('/projects');
  return response.data.data;
};

export const createProject = async (projectData: CreateProjectData): Promise<Project> => {
  const response = await api.post('/projects', projectData);
  return response.data.data;
};

export const getProjectById = async (projectId: string): Promise<Project> => {
  const response = await api.get(`/projects/${projectId}`);
  return response.data.data;
};

export const inviteMember = async (projectId: string, email: string): Promise<void> => {
  await api.post(`/projects/${projectId}/members`, { email });
};

export const removeMember = async (projectId: string, memberId: string): Promise<Project> => {
  const response = await api.delete(`/projects/${projectId}/members/${memberId}`);
  return response.data.data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}`);
};
