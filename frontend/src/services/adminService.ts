import api from './api';

/**
 * Interface for the statistics data returned from the admin stats endpoint.
 */
interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  tasksCompleted: number;
}

/**
 * Fetches dashboard statistics for the admin panel.
 * @returns {Promise<AdminStats>} A promise that resolves to the admin statistics object.
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const response = await api.get('/admin/stats');
  return response.data.data;
};
