import api from './api';
import { Task } from '@/types';

type ReorderTaskPayload = {
  id: string;
  order: number;
  status: Task['status'];
};

export const getTasks = async (projectId: string): Promise<Task[]> => {
  const response = await api.get(`/projects/${projectId}/tasks`);
  return response.data.data;
};

export const createTask = async (projectId: string, taskData: any) => {
  const response = await api.post(`/projects/${projectId}/tasks`, taskData);
  return response.data.data;
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  const response = await api.put(`/tasks/${taskId}`, updates);
  return response.data.data as Task;
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}`);
};

export const reorderTasks = async (tasks: ReorderTaskPayload[]): Promise<void> => {
  await api.post('/tasks/reorder', { tasks });
};
