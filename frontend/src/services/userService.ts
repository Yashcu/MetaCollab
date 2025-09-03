import api from './api';
import { User } from '@/types';
import { TProfileSchema, TPasswordSchema } from '@/lib/validators';

/**
 * Updates a user's profile information.
 * @param userId - The ID of the user to update.
 * @param profileData - The new profile data (name, email, avatarUrl).
 * @returns {Promise<User>} A promise that resolves to the updated user object.
 */
export const updateUserProfile = async (userId: string, profileData: TProfileSchema): Promise<User> => {
  const response = await api.put(`/users/${userId}`, profileData);
  return response.data.data;
};

/**
 * Changes a user's password.
 * @param userId - The ID of the user.
 * @param passwordData - The current and new password data.
 * @returns {Promise<void>} A promise that resolves when the password is changed.
 */
export const changeUserPassword = async (userId: string, passwordData: TPasswordSchema): Promise<void> => {
  await api.put(`/users/${userId}/password`, passwordData);
};
