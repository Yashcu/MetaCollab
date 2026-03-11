import { fetchJson } from "./fetcher";

/** A user's public profile as returned by the API */
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "user" | "admin";
}

/** Fields that can be updated on a user's profile */
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
}

/**
 * Look up a user by their email address.
 * Used by the invitation flow to find a user before inviting them.
*/
export const getUserByEmail = async (email: string): Promise<User> => {
  return fetchJson<User>(
    `/api/users?email=${encodeURIComponent(email)}`,
    { method: "GET" }
  );
};

/**
 * Fetch a user's profile by their Clerk user ID.
*/
export const getUserById = async (userId: string): Promise<User> => {
  return fetchJson<User>(`/api/users/${userId}`, { method: "GET" });
};

/**
 * Update the current user's profile (name or avatar).
*/
export const updateUserProfile = async (
  userId: string,
  profileData: UpdateProfileInput
): Promise<User> => {
  return fetchJson<User>(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
};

/**
 * Password changes are NOT handled here.
 * Use Clerk's <UserProfile /> component which handles this securely.
 * This function exists only to give a helpful error if called by mistake.
 */
export const changeUserPassword = async (): Promise<never> => {
  throw new Error(
    "Password changes must be done through Clerk's <UserProfile /> component, not through this service."
  );
};