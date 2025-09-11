import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '@/types';
import { useEffect } from "react";
import { useSocketStore } from "./socketStore";
import { toast } from "@/components/ui/use-toast";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user: User, token: string) => set({
        user,
        token,
        isAuthenticated: true
      }),
      logout: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),
      setUser: (user: User) => set((state) => ({
        ...state,
        user
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useKickedFromProject = () => {
  const { socket } = useSocketStore();
  useEffect(() => {
  if (!socket) return;
  const onKicked = ({ projectName }: { projectName: string }) => { // see fix for 2nd error!
    toast({
      variant: "destructive",
      title: "Removed from Project",
      description: `You have been removed from "${projectName}".`,
    });
    window.location.replace("/dashboard");
  };
  socket.on("kicked:from_project", onKicked);
  return () => {
    socket.off("kicked:from_project", onKicked);
  };
}, [socket]);
};
