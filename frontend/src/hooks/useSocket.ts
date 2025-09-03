import { useEffect } from 'react';
import { useSocketStore } from '@/state/socketStore';
import { useAuthStore } from '@/state/authStore';

/**
 * Custom hook `useSocket`.
 * Manages the lifecycle of the socket connection based on auth state.
 * @returns The socket instance from the zustand store.
 */
export const useSocket = () => {
  const { socket, connect, disconnect } = useSocketStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  return socket;
};
