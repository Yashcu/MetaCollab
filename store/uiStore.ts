import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "light" | "dark" | "system";

export interface UIState {
  theme: Theme;
  isSidebarOpen: boolean;
  isGlobalLoading: boolean;

  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "system",
      isSidebarOpen: false,
      isGlobalLoading: false,

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),

      reset: () =>
        set({
          isGlobalLoading: false,
        }),
    }),
    {
      name: "ui-storage",
      version: 1,

      partialize: (state) => ({
        theme: state.theme,
        isSidebarOpen: state.isSidebarOpen,
      }),
    },
  )
);