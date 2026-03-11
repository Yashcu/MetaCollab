import { fetchJson } from "./fetcher";

// Public user profile returned from the API
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "user" | "admin";
}

// Fields allowed for profile updates
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
}

// Find a user by email
export const getUserByEmail = async (email: string): Promise<User> => {
  return fetchJson<User>(
    `/api/users?email=${encodeURIComponent(email)}`,
    { method: "GET" }
  );
};

// Get a user by ID
export const getUserById = async (userId: string): Promise<User> => {
  return fetchJson<User>(`/api/users/${userId}`, { method: "GET" });
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  profileData: UpdateProfileInput
): Promise<User> => {
  return fetchJson<User>(`/api/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(profileData),
  });
};