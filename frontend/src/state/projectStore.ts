import { useEffect } from "react";
import { useSocketStore } from "./socketStore";
import { getProjects } from "@/services/projectService";
import { create } from 'zustand';
import { Project, Task } from '@/types';
import { reorderTasks as reorderTasksService } from '@/services/taskService';
import { toast } from '@/components/ui/use-toast';
import debounce from 'lodash/debounce';
import { useAuthStore } from '@/state/authStore';

const debouncedReorder = debounce((projectId: string, payload: any[], originalTasks: Task[], set) => {
  reorderTasksService(projectId, payload).catch(() => {
    toast({ variant: "destructive", title: "Failed to save order. Reverting." });
    set({ tasks: originalTasks });
  });
}, 2000);

interface Cursor {
  user: { userId: string; userName: string };
  position: { x: number; y: number };
}

interface ProjectState {
  activeProject: Project | null;
  projects: Project[];
  tasks: Task[];
  cursors: Map<string, Omit<Cursor, "user">>;

  setProjects: (projects: Project[]) => void;
  initializeProject: (project: Project, tasks: Task[]) => void;
  setActiveProject: (project: Project) => void;
  setTasks: (tasks: Task[]) => void;
  moveCursor: (position: { x: number; y: number }) => void;
  reorderTasks: (reorderedTasks: Task[]) => void;
  clearProject: () => void;
  init: () => void;
  cleanup: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  activeProject: null,
  projects: [],
  tasks: [],
  cursors: new Map(),

  initializeProject: (project, tasks) => {
    set({ activeProject: project, tasks });
    get().init();
  },

  setActiveProject: (project) => {
    set({ activeProject: project });
  },

  setTasks: (tasks) => {
    set({ tasks });
  },

  setProjects: (projects) => set({ projects }),

  moveCursor: (position) => {
    const { socket } = useSocketStore.getState();
    const projectId = get().activeProject?.id;
    if (socket && projectId) {
      socket.emit('cursor:move', { projectId, x: position.x, y: position.y });
    }
  },

  reorderTasks: (reorderedTasks) => {
    const originalTasks = get().tasks;
    set({ tasks: reorderedTasks });

    const projectId = get().activeProject?.id;
    if (projectId) {
      const payload = reorderedTasks.map(({ id, order, status }) => ({ id, order, status }));
      debouncedReorder(projectId, payload, originalTasks, set);
    }
  },

  clearProject: () => {
    get().cleanup();
    set({ activeProject: null, tasks: [], cursors: new Map() });
  },

  init: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    socket.on('tasks:updated', (newTasks: Task[]) => {
      set({ tasks: newTasks });
    });

    socket.on('project:updated', (updatedProject: Project) => {
      set({ activeProject: updatedProject });
      toast({ description: "Project details have been updated." });
    });

    socket.on('project:deleted', ({ projectId }: { projectId: string }) => {
      if (get().activeProject?.id === projectId) {
        toast({
          variant: 'destructive',
          title: 'Project Deleted',
          description: 'The project owner has deleted this project.',
        });
        window.location.replace('/dashboard');
      }
    });

    socket.on('cursor:move', (data: Cursor) => {
      if (data.user.userId === useAuthStore.getState().user?.id) return;
      set((state) => {
        const newCursors = new Map(state.cursors);
        newCursors.set(data.user.userId, { position: data.position });
        return { cursors: newCursors };
      });
    });

    socket.on('cursor:leave', ({ userId }: { userId: string }) => {
      set((state) => {
        const newCursors = new Map(state.cursors);
        newCursors.delete(userId);
        return { cursors: newCursors };
      });
    });
  },

  cleanup: () => {
    const { socket } = useSocketStore.getState();
    if (!socket) return;

    socket.off('tasks:updated');
    socket.off('project:updated');
    socket.off('project:deleted');
    socket.off('cursor:move');
    socket.off('cursor:leave');
  },
}));

export const useDashboardRealtime = () => {
  const { socket } = useSocketStore();
  const setProjects = useProjectStore(s => s.setProjects);

  useEffect(() => {
    if (!socket) return;
    const onRefetch = async () => {
      const projects = await getProjects();
      setProjects(projects);
      toast({ description: "Project list updated!" });
    };
    socket.on("dashboard:refetch", onRefetch);
    return () => {
      socket.off("dashboard:refetch", onRefetch);
    };
  }, [socket, setProjects]);
};
