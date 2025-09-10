import { NavLink } from "react-router-dom";
import { LayoutDashboard, User, ShieldCheck, LucideIcon } from "lucide-react";
import { useUIStore } from "@/state/uiStore";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface NavLinkItem {
  to: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const navLinks: NavLinkItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/admin", label: "Admin Panel", icon: ShieldCheck, adminOnly: true },
];

const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center px-4 py-2 mt-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700",
    isActive
      ? "bg-gray-200 dark:bg-gray-700 font-semibold"
      : "text-gray-600 dark:text-gray-300"
  );

const Sidebar = () => {
  const { isSidebarOpen, toggleSidebar } = useUIStore();
  const { user } = useAuth();

  const closeSidebar = () => {
    if (isSidebarOpen) {
      toggleSidebar();
    }
  };

  const accessibleLinks = navLinks.filter(
    (link) => !link.adminOnly || (link.adminOnly && user?.role === "admin")
  );

  return (
    <>
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
          {accessibleLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={getNavLinkClass}
              onClick={closeSidebar}
            >
              <Icon className="w-5 h-5" />
              <span className="mx-4">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
