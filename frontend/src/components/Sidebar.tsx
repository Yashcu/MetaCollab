import { NavLink } from "react-router-dom";
import { LayoutDashboard, User, ShieldCheck } from "lucide-react"; // <-- Trophy icon removed
import { useUIStore } from "@/state/uiStore";
import { useAuth } from "@/hooks/useAuth"; // <-- Import useAuth
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuth(); // <-- Get the authenticated user

  const closeSidebar = () => {
    if (isSidebarOpen) {
      toggleSidebar();
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-2 mt-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 ${
      isActive
        ? "bg-gray-200 dark:bg-gray-700 font-semibold"
        : "text-gray-600 dark:text-gray-300"
    }`;

  return (
    <>
      {/* ... (mobile sidebar overlay remains the same) ... */}
      <div
        className={cn(
          "fixed md:relative z-50 md:z-auto flex h-full w-64 flex-col bg-white dark:bg-gray-800 border-r dark:border-gray-700 transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-center mt-8">
          <span className="text-gray-800 dark:text-white text-2xl font-semibold">
            MetaCollab
          </span>
        </div>
        <nav className="mt-10 px-2">
          <NavLink
            to="/dashboard"
            className={navLinkClass}
            onClick={closeSidebar}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="mx-4">Dashboard</span>
          </NavLink>
          {/* Leaderboard NavLink REMOVED */}
          <NavLink
            to="/profile"
            className={navLinkClass}
            onClick={closeSidebar}
          >
            <User className="w-5 h-5" />
            <span className="mx-4">Profile</span>
          </NavLink>
          {/* **SECURITY UPDATE**: Conditionally render the Admin Panel link */}
          {user?.role === "admin" && (
            <NavLink
              to="/admin"
              className={navLinkClass}
              onClick={closeSidebar}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="mx-4">Admin Panel</span>
            </NavLink>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
