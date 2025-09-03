import { useAuthStore } from "@/state/authStore";

/**
 * Custom hook `useAuth`.
 * Provides a clean interface to access the authentication state and actions
 * from the `useAuthStore`.
 *
 * @returns An object with auth state (user, token, isAuthenticated)
 * and actions (login, logout, setUser).
 */
export const useAuth = () => {
  const state = useAuthStore();
  return state;
};
