import { createBrowserRouter, RouterProvider } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
// import LeaderboardPage from "./pages/LeaderboardPage"; // <-- REMOVED
import AdminPage from "./pages/AdminPage";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute"; // <-- IMPORT AdminRoute
import MainLayout from "./components/MainLayout";
import { Toaster } from "./components/ui/toaster";
import WorkspaceLayout from "./pages/WorkspaceLayout";

const router = createBrowserRouter([
  // Public routes
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },

  // Private routes for all authenticated users
  {
    path: "/",
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "profile", element: <ProfilePage /> },
          // { path: "leaderboard", element: <LeaderboardPage /> }, // <-- REMOVED
        ],
      },
      // Admin-only routes
      {
        element: <AdminRoute />, // <-- WRAP admin routes
        children: [
          {
            element: <MainLayout />, // Use the same layout
            children: [{ path: "admin", element: <AdminPage /> }],
          },
        ],
      },
      // Workspace layout remains a top-level route
      {
        path: "project/:projectId",
        element: <WorkspaceLayout />,
      },
    ],
  },
]);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
