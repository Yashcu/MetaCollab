import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

/**
 * A route guard component that only allows access to admin users.
 * If the user is authenticated but not an admin, they are redirected
 * to the main dashboard.
 */
const AdminRoute = () => {
  const { user } = useAuth();

  // The user object from the auth state now contains the 'role'
  if (user && user.role === "admin") {
    return <Outlet />; // Render the child route (e.g., AdminPage)
  }

  // Redirect to the dashboard if the user is not an admin
  return <Navigate to="/dashboard" replace />;
};

export default AdminRoute;
