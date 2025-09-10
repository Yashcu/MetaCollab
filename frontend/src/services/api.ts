import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/state/authStore';

interface ApiErrorResponse {
  message: string;
  errors?: unknown;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();

      if (window.location.pathname !== '/login') {
        logout();
        window.location.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
