import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = "light" | "dark" | "system";

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isProjectsLoading: boolean;
  setProjectsLoading: (isLoading: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

/**
 * Zustand store for UI-related state.
 * Manages the color theme and global loading indicators.
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      setTheme: (theme) => set({ theme }),
      isProjectsLoading: false,
      setProjectsLoading: (isLoading) => set({ isProjectsLoading: isLoading }),
      isSidebarOpen: false,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    }),
    {
      name: 'ui-storage', // Key for localStorage
    }
  )
);
