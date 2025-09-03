import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket"; // 1. Import the hook

const PrivateRoute = () => {
  const { isAuthenticated } = useAuth();
  useSocket();

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
