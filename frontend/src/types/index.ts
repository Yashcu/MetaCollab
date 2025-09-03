/**
 * TypeScript type definitions for the application.
 */

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  assignee?: User;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: User;
  members: User[];
  tasks: Task[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}
