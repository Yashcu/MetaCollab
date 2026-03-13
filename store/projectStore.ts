import { create } from "zustand";
import { toast } from "sonner";
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
  cursors: Record<string, Omit<Cursor, "user">>;
  isLoadingProjects: boolean;
  isLoadingTasks: boolean;
  error: string | null;

  fetchProjects: () => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<void>;
  fetchTasks: (projectId: string) => Promise<void>;
  setProjects: (projects: Project[]) => void;
  setTasks: (tasks: Task[]) => void;
  setActiveProject: (project: Project) => void;
  initializeProject: (project: Project, tasks: Task[]) => void;
  reorderTasks: (reorderedTasks: Task[]) => void;
  setCursors: (cursors: Record<string, Omit<Cursor, "user">>) => void;
  clearProject: () => void;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Debounced reorder helper
//
// When the user drags a task, we update the UI immediately (optimistic).
// Then we wait 800ms of inactivity before saving to the server.
// ---------------------------------------------------------------------------
function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

const debouncedSaveReorder = debounce(
  async (
    projectId: string,
    reorderedTasks: Task[],
    originalTasks: Task[],
    setTasksFn: (tasks: Task[]) => void
  ) => {
    try {
      const payload = reorderedTasks.map((task) => ({
        id: task.id,
        order: task.order,
      }));

      // BUG FIX: reorderTasksService requires (projectId, tasks[]) — projectId was missing
      await reorderTasksService(projectId, payload);
    } catch (error) {
      console.error("[projectStore] Failed to save task order:", error);
      setTasksFn(originalTasks);
      toast.error("Failed to save order", {
        description: "Task order has been reverted.",
      });
    }
  },
  800
);

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  tasks: [],
  cursors: {},
  isLoadingProjects: false,
  isLoadingTasks: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoadingProjects: true, error: null });
    try {
      const projects = await getProjects();
      set({ projects });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load projects";
      set({ error: message });
      toast.error("Could not load projects", { description: message });
    } finally {
      set({ isLoadingProjects: false });
    }
  },

  fetchProjectById: async (projectId: string) => {
    set({ isLoadingProjects: true, error: null });
    try {
      const project = await getProjectById(projectId);
      set({ activeProject: project });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load project";
      set({ error: message });
      toast.error("Could not load project", { description: message });
    } finally {
      set({ isLoadingProjects: false });
    }
  },

  fetchTasks: async (projectId: string) => {
    set({ isLoadingTasks: true, error: null });
    try {
      const tasks = await getTasks(projectId);
      set({ tasks });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load tasks";
      set({ error: message });
      toast.error("Could not load tasks", { description: message });
    } finally {
      set({ isLoadingTasks: false });
    }
  },

  setProjects: (projects) => set({ projects }),
  setTasks: (tasks) => set({ tasks }),
  setActiveProject: (project) => set({ activeProject: project }),

  initializeProject: (project, tasks) => {
    set({
      activeProject: project,
      tasks,
      cursors: {},
      error: null,
    });
  },

  // Called after drag-and-drop: update task order in UI immediately,
  // then save to server after debounce.
  reorderTasks: (reorderedTasks: Task[]) => {
    const { activeProject } = get();
    // BUG FIX: bail out early if no active project — we need the projectId for the API call
    if (!activeProject) return;

    const originalTasks = get().tasks;
    set({ tasks: reorderedTasks });

    debouncedSaveReorder(
      activeProject.id,
      reorderedTasks,
      originalTasks,
      (tasks) => set({ tasks })
    );
  },

  setCursors: (cursors) =>
    set({ cursors: { ...cursors } }),

  clearProject: () => {
    set({
      activeProject: null,
      tasks: [],
      cursors: {},
      error: null,
    });
  },

  reset: () => {
    set({
      projects: [],
      activeProject: null,
      tasks: [],
      cursors: {},
      isLoadingProjects: false,
      isLoadingTasks: false,
      error: null,
    });
  },
}));