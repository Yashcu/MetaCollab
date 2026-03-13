import { fetchJson } from "./fetcher";
import { TaskStatus, TaskPriority } from "@/lib/types";

// Task data returned from the API
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  // BUG FIX: the Prisma model field is `projectId`, not `project`.
  // The old interface had `project: string` which never matched the actual API response,
  // causing task.projectId to be undefined everywhere it was used.
  projectId: string;
  assignee?: string | null;
  order: number;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  order?: number;
  dueDate?: string | null;
}

export const getTasks = async (projectId: string): Promise<Task[]> => {
  return fetchJson<Task[]>(
    `/api/tasks?projectId=${encodeURIComponent(projectId)}`,
    { method: "GET" }
  );
};

export const createTask = async (
  projectId: string,
  taskData: CreateTaskInput
): Promise<Task> => {
  return fetchJson<Task>("/api/tasks", {
    method: "POST",
    // API expects the field named "project" in the request body (maps to projectId in schema)
    body: JSON.stringify({ ...taskData, project: projectId }),
  });
};

export const updateTask = async (
  taskId: string,
  data: UpdateTaskInput
): Promise<Task> => {
  return fetchJson<Task>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  return fetchJson<void>(`/api/tasks/${taskId}`, { method: "DELETE" });
};

export const reorderTasks = async (
  projectId: string,
  reorderedTasks: Array<{ id: string; order: number }>
): Promise<void> => {
  return fetchJson<void>("/api/tasks/reorder", {
    method: "PATCH",
    body: JSON.stringify({ projectId, tasks: reorderedTasks }),
  });
};