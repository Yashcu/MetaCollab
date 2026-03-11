import { fetchJson } from "./fetcher";

/** Stats shown on the admin dashboard */
interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  tasksCompleted: number;
}

// Gets platform statistics for the admin dashboard
export const getAdminStats = async (): Promise<AdminStats> => {
  return fetchJson<AdminStats>("/api/admin", { method: "GET" });
};