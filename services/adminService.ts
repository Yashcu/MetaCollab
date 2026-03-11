import { fetchJson } from "./fetcher";

/** Stats shown on the admin dashboard */
interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  tasksCompleted: number;
}

/**
 * Fetch platform-wide statistics for the admin dashboard.
 * Only works if the current user has the "admin" role in Clerk's publicMetadata.
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  return fetchJson<AdminStats>("/api/admin", { method: "GET" });
};