import { fetchJson } from "./fetcher";

// A project member with their role
export interface ProjectMember {
  userId: string;
  role: "owner" | "admin" | "member";
}

export interface Project {
  id: string;
  name: string;
  description: string;
  owner: string;
  members: ProjectMember[];
  _count?: {
    members: number;
    tasks: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
}

export const getProjects = async (): Promise<Project[]> => {
  return fetchJson<Project[]>("/api/projects", { method: "GET" });
};

export const createProject = async (
  projectData: CreateProjectInput
): Promise<Project> => {
  return fetchJson<Project>("/api/projects", {
    method: "POST",
    body: JSON.stringify(projectData),
  });
};

export const getProjectById = async (projectId: string): Promise<Project> => {
  return fetchJson<Project>(`/api/projects/${projectId}`, { method: "GET" });
};

export const updateProject = async (
  projectId: string,
  data: UpdateProjectInput
): Promise<Project> => {
  return fetchJson<Project>(`/api/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const deleteProject = async (projectId: string): Promise<void> => {
  return fetchJson<void>(`/api/projects/${projectId}`, { method: "DELETE" });
};