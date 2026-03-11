"use client";

// Client component — needs usePathname() for active link detection
// and useProjectStore() to show the user's project list in the sidebar.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, FolderKanban, Settings, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/projectStore";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/dashboard/settings", label: "Settings", icon: Settings, exact: false },
];

export function Sidebar() {
    const pathname = usePathname();
    const projects = useProjectStore((s) => s.projects);

    const isActive = (href: string, exact: boolean) =>
        exact ? pathname === href : pathname.startsWith(href);

    return (
        <aside className="flex flex-col w-60 h-screen border-r border-white/[0.06] bg-[#070b14] shrink-0">
            {/* Logo mark + wordmark */}
            <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.06]">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500">
                    <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                {/* font-display maps to --font-syne via the Tailwind theme in globals.css */}
                <span className="text-white font-bold text-[15px] tracking-tight font-display">
                    MetaCollab
                </span>
            </div>

            {/* Primary navigation */}
            <nav className="flex flex-col gap-1 px-3 pt-4">
                {navItems.map(({ href, label, icon: Icon, exact }) => (
                    <Link
                        key={href}
                        href={href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                            isActive(href, exact)
                                ? "bg-white/10 text-white font-medium"
                                : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                        )}
                    >
                        <Icon className="w-4 h-4 shrink-0" />
                        {label}
                    </Link>
                ))}
            </nav>

            {/* Recent projects — capped at 8, scrollable if more exist */}
            {projects.length > 0 && (
                <div className="flex flex-col gap-1 px-3 pt-5 min-h-0 overflow-y-auto">
                    <p className="text-[10px] uppercase tracking-widest text-white/25 px-3 mb-1 font-medium shrink-0">
                        Projects
                    </p>
                    {projects.slice(0, 8).map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.id}`}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 truncate shrink-0",
                                pathname.startsWith(`/projects/${project.id}`)
                                    ? "bg-white/10 text-white font-medium"
                                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                            )}
                        >
                            <FolderKanban className="w-4 h-4 shrink-0 text-cyan-400/60" />
                            <span className="truncate">{project.name}</span>
                        </Link>
                    ))}
                </div>
            )}

            {/* Account controls pinned to bottom */}
            <div className="mt-auto px-4 py-4 border-t border-white/[0.06] flex items-center gap-3">
                <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                <span className="text-white/50 text-xs truncate">Account</span>
            </div>
        </aside>
    );
}