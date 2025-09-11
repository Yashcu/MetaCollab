import React, { Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { Skeleton } from "./components/ui/skeleton";

const PageLoader = () => (
  <div className="flex h-screen w-screen items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="h-4 w-48" />
    </div>
  </div>
);

const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const SignupPage = React.lazy(() => import("./pages/SignupPage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const AdminPage = React.lazy(() => import("./pages/AdminPage"));
const WorkspaceLayout = React.lazy(() => import("./pages/WorkspaceLayout"));

import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import MainLayout from "./components/MainLayout";

import { useDashboardRealtime } from "@/state/projectStore";
import { useInvitationRealtime } from "@/state/invitationStore";
import { useKickedFromProject } from "@/state/authStore";
import { ConnectionStatusOverlay } from "@/components/ConnectionStatusOverlay";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },

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
        ],
      },
      {
        element: <AdminRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [{ path: "admin", element: <AdminPage /> }],
          },
        ],
      },
      {
        path: "project/:projectId",
        element: <WorkspaceLayout />,
      },
    ],
  },
]);

function App() {
  useDashboardRealtime();
  useInvitationRealtime();
  useKickedFromProject();
  return (
    <>
      <ConnectionStatusOverlay />
      <Suspense fallback={<PageLoader />}>
        <RouterProvider router={router} />
      </Suspense>
      <Toaster />
    </>
  );
}

export default App;
