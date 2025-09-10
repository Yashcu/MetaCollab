import api from './api';
import { Task } from '@/types';

export const getTasks = async (projectId: string): Promise<Task[]> => {
  const response = await api.get(`/projects/${projectId}/tasks`);
  return response.data.data;
};

export const createTask = async (projectId: string, taskData: { title: string }): Promise<Task> => {
  const response = await api.post(`/projects/${projectId}/tasks`, taskData);
  return response.data.data;
};

export const deleteTask = async (projectId: string, taskId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}/tasks/${taskId}`);
};

export const reorderTasks = async (projectId: string, tasks: any[]): Promise<void> => {
  await api.patch(`/projects/${projectId}/tasks/reorder`, { tasks });
};
