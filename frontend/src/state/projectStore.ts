import { create } from 'zustand';
import { Project, Task } from '@/types';

interface ProjectState {
  activeProject: Project | null;
  tasks: Task[];
  setActiveProject: (project: Project) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
}

/**
 * Zustand store for project-related state (placeholder for now).
 *
 * @state activeProject - The currently viewed project.
 * @state tasks - The list of tasks for the active project.
 */
export const useProjectStore = create<ProjectState>((set) => ({
  activeProject: null,
  tasks: [],
  setActiveProject: (project) => set({ activeProject: project }),
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
}));
