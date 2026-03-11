import { fetchJson } from "./fetcher";

// A project member with their role
export interface ProjectMember {
  userId: string;
  role: "owner" | "admin" | "member";
}

// Project data returned from the API
export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

// Data required to create a project
export interface CreateProjectInput {
  name: string;
  description?: string;
}

// Fields that can be updated on a project
export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

// Get all projects for the current user
export const getProjects = async (): Promise<Project[]> => {
  return fetchJson<Project[]>("/api/projects", { method: "GET" });
};

// Create a new project
export const createProject = async (
  projectData: CreateProjectInput
): Promise<Project> => {
  return fetchJson<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(projectData),
  });
};

// Get a project by ID
export const getProjectById = async (projectId: string): Promise<Project> => {
  return fetchJson<Project>(`/api/projects/${projectId}`, { method: "GET" });
};

// Update project details
export const updateProject = async (
  projectId: string,
  data: UpdateProjectInput
): Promise<Project> => {
  return fetchJson<Project>(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

// Delete a project
export const deleteProject = async (projectId: string): Promise<void> => {
  return fetchJson<void>(`/api/projects/${projectId}`, { method: "DELETE" });
};