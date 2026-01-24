import api from './api';
import { User } from '@/types';
import { TLoginSchema, TSignupSchema } from '@/lib/validators';

/**
 * Calls the login API endpoint.
 * @param credentials - The user's email and password.
 * @returns An object containing the user and JWT token.
 */
export const login = async (credentials: TLoginSchema): Promise<{ user: User, token: string }> => {
  try {
    const response = await api.post('/auth/login', credentials);
    if (!response.data?.data) {
      throw new Error('Invalid response format from server');
    }
    return response.data.data;
  } catch (error: any) {
    // Ensure error has a meaningful message
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Login failed. Please try again.');
  }
};

/**
 * Calls the signup API endpoint.
 * @param userData - The new user's name, email, and password.
 * @returns An object containing the new user and JWT token.
 */
export const signup = async (userData: TSignupSchema): Promise<{ user: User, token: string }> => {
  try {
    const response = await api.post('/auth/signup', userData);
    if (!response.data?.data) {
      throw new Error('Invalid response format from server');
    }
    return response.data.data;
  } catch (error: any) {
    // Ensure error has a meaningful message
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || 'Signup failed. Please try again.');
  }
};

export const getUserProfile = async () => {
  const response = await api.get('/users/me'); // Assuming a /me route exists
  return response.data;
};
