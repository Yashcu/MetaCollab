import { fetchJson } from "./fetcher";

/** A single member of a project, with their role */
export interface ProjectMember {
  userId: string;
  role: "owner" | "admin" | "member";
}

/** A project document as returned by the API */
export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
}

/** Fields accepted when creating a new project */
export interface CreateProjectInput {
  name: string;
  description?: string;
}

/** Fields accepted when updating an existing project */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

/**
 * Fetch all projects the current user belongs to.
 */
export const getProjects = async (): Promise<Project[]> => {
  return fetchJson<Project[]>("/api/projects", { method: "GET" });
};

/**
 * Create a new project. The current user becomes the owner automatically.
*/
export const createProject = async (
  projectData: CreateProjectInput
): Promise<Project> => {
  return fetchJson<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(projectData),
  });
};

/**
 * Fetch a single project by its MongoDB ID.
 * The current user must be a member of the project.
*/
export const getProjectById = async (projectId: string): Promise<Project> => {
  return fetchJson<Project>(`/api/projects/${projectId}`, { method: "GET" });
};

/**
 * Update a project's name or description.
 * Only the project owner can do this.
*/
export const updateProject = async (
  projectId: string,
  data: UpdateProjectInput
): Promise<Project> => {
  return fetchJson<Project>(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

/**
 * Delete a project and all its tasks and invitations.
 * Only the project owner can do this.
*/
export const deleteProject = async (projectId: string): Promise<void> => {
  return fetchJson<void>(`/api/projects/${projectId}`, { method: "DELETE" });
};

/**
 * Invite a user to a project by their email address.
 * Only the project owner can invite members. 
*/
export const inviteMember = async (
  projectId: string,
  email: string
): Promise<void> => {
  await fetchJson<void>("/api/invitations", {
    method: "POST",
    body: JSON.stringify({ projectId, email }),
  });
};