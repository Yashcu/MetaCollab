import api from './api';
import { User } from '@/types';
import { TLoginSchema, TSignupSchema } from '@/lib/validators';

/**
 * Calls the login API endpoint.
 * @param credentials - The user's email and password.
 * @returns An object containing the user and JWT token.
 */
export const login = async (credentials: TLoginSchema): Promise<{ user: User, token: string }> => {
  const response = await api.post('/auth/login', credentials);
  // The backend now returns the user object and token in the `data` field of the success response
  return response.data.data;
};

/**
 * Calls the signup API endpoint.
 * @param userData - The new user's name, email, and password.
 * @returns An object containing the new user and JWT token.
 */
export const signup = async (userData: TSignupSchema): Promise<{ user: User, token: string }> => {
  const response = await api.post('/auth/signup', userData);
  return response.data.data;
};

export const getUserProfile = async () => {
  const response = await api.get('/users/me'); // Assuming a /me route exists
  return response.data;
};
