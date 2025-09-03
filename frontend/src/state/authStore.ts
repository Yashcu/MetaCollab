import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from '@/types';

/**
 * Zustand store for authentication.
 * Manages the user's auth status, user info, and JWT token.
 * It uses `persist` middleware to save state to localStorage,
 * keeping the user logged in across sessions.
 *
 * @state user - The authenticated user object or null.
 * @state token - The JWT token or null.
 * @state isAuthenticated - Boolean flag for auth status.
 *
 * @action login - Sets user and token, marking as authenticated.
 * @action logout - Clears user and token.
 * @action setUser - Updates the user object (e.g., after profile edit).
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage', // Key for localStorage
    }
  )
);
