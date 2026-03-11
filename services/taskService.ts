import { fetchJson } from "./fetcher";
import { TaskStatus, TaskPriority } from "@/lib/types";

const BATCH_SIZE = 5;

// Task data returned from the API
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: string;
  assignee?: string;
  order: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Data required to create a task
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

// Fields that can be updated on a task
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  order?: number;
  dueDate?: string | null;
}

// Get all tasks for a project
export const getTasks = async (projectId: string): Promise<Task[]> => {
  return fetchJson<Task[]>(
    `/api/tasks?projectId=${encodeURIComponent(projectId)}`,
    { method: "GET" }
  );
};

// Create a task in a project
export const createTask = async (
  projectId: string,
  taskData: CreateTaskInput
): Promise<Task> => {
  return fetchJson<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ ...taskData, project: projectId }),
  });
};

// Update a task
export const updateTask = async (
  taskId: string,
  data: UpdateTaskInput
): Promise<Task> => {
  return fetchJson<Task>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Delete a task
export const deleteTask = async (taskId: string): Promise<void> => {
  return fetchJson<void>(`/api/tasks/${taskId}`, { method: "DELETE" });
};

// ⚠️ fires N individual PATCH requests — replace with bulk endpoint when board grows large
export const reorderTasks = async (
  reorderedTasks: Array<{ id: string; order: number }>
): Promise<void> => {
  for (let i = 0; i < reorderedTasks.length; i += BATCH_SIZE) {
    const batch = reorderedTasks.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map((task) =>
        updateTask(task.id, { order: task.order })
      )
    );
  }
};