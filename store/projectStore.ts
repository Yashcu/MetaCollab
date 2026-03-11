import { create } from "zustand";
import { toast } from "sonner";
import debounce from "lodash/debounce";
import {
  type Project,
  getProjects,
  getProjectById,
} from "@/services/projectService";
import {
  type Task,
  getTasks,
  reorderTasks as reorderTasksService,
} from "@/services/taskService";

export interface Cursor {
  user: { userId: string; userName: string };
  position: { x: number; y: number };
}

interface ProjectState {
  projects: Project[];
  activeProject: Project | null;
  tasks: Task[];
  cursors: Map<string, Omit<Cursor, "user">>;
  isLoading: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<void>;
  fetchTasks: (projectId: string) => Promise<void>;
  setProjects: (projects: Project[]) => void;
  setTasks: (tasks: Task[]) => void;
  setActiveProject: (project: Project) => void;
  initializeProject: (project: Project, tasks: Task[]) => void;
  reorderTasks: (reorderedTasks: Task[]) => void;
  setCursors: (cursors: Map<string, Omit<Cursor, "user">>) => void;
  clearProject: () => void;
  reset: () => void; // called on logout
}

// ---------------------------------------------------------------------------
// Debounced reorder helper
//
// When the user drags a task, we update the UI immediately (optimistic).
// Then we wait 800ms of inactivity before saving to the server.
// This prevents sending a PATCH request for every pixel of mouse movement.
//
// Uses the service function (which sends individual PATCH requests per task)
// instead of the old non-existent bulk reorder endpoint.
// ---------------------------------------------------------------------------
const debouncedSaveReorder = debounce(
  async (
    reorderedTasks: Task[],
    originalTasks: Task[],
    setTasksFn: (tasks: Task[]) => void
  ) => {
    try {
      const payload = reorderedTasks.map((task) => ({
        id: task.id,
        order: task.order,
      }));

      await reorderTasksService(payload);
    } catch (error) {
      console.error("[projectStore] Failed to save task order:", error);

      // Save failed — revert the UI back to the original order
      setTasksFn(originalTasks);

      toast.error("Failed to save order", {
        description: "Task order has been reverted.",
      });
    }
  },
  800 // wait 800ms after the last drag event before saving
);

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  tasks: [],
  cursors: new Map(),
  isLoading: false,
  error: null,

  // Fetch all projects the current user belongs to
  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await getProjects();
      set({ projects });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load projects";
      set({ error: message });
      toast.error("Could not load projects", { description: message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch a single project and set it as the active project
  fetchProjectById: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const project = await getProjectById(projectId);
      set({ activeProject: project });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load project";
      set({ error: message });
      toast.error("Could not load project", { description: message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetch all tasks for the active project
  fetchTasks: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await getTasks(projectId);
      set({ tasks });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load tasks";
      set({ error: message });
      toast.error("Could not load tasks", { description: message });
    } finally {
      set({ isLoading: false });
    }
  },

  setProjects: (projects) => set({ projects }),
  setTasks: (tasks) => set({ tasks }),
  setActiveProject: (project) => set({ activeProject: project }),

  // Set both project and tasks at once — used when entering a project view
  initializeProject: (project, tasks) => {
    set({
      activeProject: project,
      tasks,
      cursors: new Map(), // clear other users' cursors when entering a new project
      error: null,
    });
  },

  // Called after drag-and-drop: update task order in UI immediately,
  // then save to server after a short debounce delay.
  reorderTasks: (reorderedTasks: Task[]) => {
    const originalTasks = get().tasks;
    set({ tasks: reorderedTasks });

    debouncedSaveReorder(
      reorderedTasks,
      originalTasks,
      (tasks) => set({ tasks })
    );
  },

  setCursors: (cursors) => set({ cursors }),

  // Leave the current project — clear tasks, cursors, and active project
  clearProject: () => {
    set({
      activeProject: null,
      tasks: [],
      cursors: new Map(),
      error: null,
    });
  },

  // Full reset on logout — clear everything
  reset: () => {
    set({
      projects: [],
      activeProject: null,
      tasks: [],
      cursors: new Map(),
      isLoading: false,
      error: null,
    });
  },
}));