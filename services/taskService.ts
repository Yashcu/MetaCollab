import { fetchJson } from "./fetcher";

/** A task document as returned by the API */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  project: string;
  assignee?: string;
  order: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** Fields accepted when creating a new task */
export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
  assigneeId?: string;
  dueDate?: string;
}

/** Fields accepted when updating an existing task */
export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: "todo" | "in-progress" | "done";
  priority?: "low" | "medium" | "high";
  assigneeId?: string | null;   // null = unassign
  order?: number;
  dueDate?: string | null;      // null = remove due date
}

/**
 * Fetch all tasks for a project, sorted by their order field.
*/
export const getTasks = async (projectId: string): Promise<Task[]> => {
  return fetchJson<Task[]>(
    `/api/tasks?projectId=${encodeURIComponent(projectId)}`,
    { method: "GET" }
  );
};

/**
 * Create a new task inside a project.
*/
export const createTask = async (
  projectId: string,
  taskData: CreateTaskInput
): Promise<Task> => {
  return fetchJson<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify({ ...taskData, project: projectId }),
  });
};

/**
 * Update one or more fields on an existing task.
*/
export const updateTask = async (
  taskId: string,
  data: UpdateTaskInput
): Promise<Task> => {
  return fetchJson<Task>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

/**
 * Delete a task permanently.
*/
export const deleteTask = async (taskId: string): Promise<void> => {
  return fetchJson<void>(`/api/tasks/${taskId}`, { method: "DELETE" });
};

/**
 * Reorder multiple tasks after a drag-and-drop operation.
 *
 * There is no bulk-reorder API endpoint. Instead we update each task
 * individually with its new order value. We use Promise.all so all
 * updates happen in parallel rather than one by one.
*/
export const reorderTasks = async (
  reorderedTasks: Array<{ id: string; order: number }>
): Promise<void> => {
  // Update every task's order in parallel — faster than sequential awaits
  await Promise.all(
    reorderedTasks.map((task) =>
      updateTask(task.id, { order: task.order })
    )
  );
};