"use client";

// Client shell for project pages.
// Handles data fetching, navigation tabs, and loading state.
// Kept separate from the layout so the layout itself stays a server component.
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Kanban, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectStore } from "@/store/projectStore";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const tabs = [
    { label: "Board", icon: Kanban, suffix: "" },
    { label: "Chat", icon: MessageSquare, suffix: "/chat" },
];

interface ProjectShellProps {
    projectId: string;
    children: React.ReactNode;
}

export function ProjectShell({ projectId, children }: ProjectShellProps) {
    const pathname = usePathname();
    const { fetchProjectById, fetchTasks, activeProject, isLoadingProjects: isLoading } =
        useProjectStore();

    // Fetch project details and its tasks whenever the project ID changes.
    // This covers both initial load and switching between projects.
    useEffect(() => {
        fetchProjectById(projectId);
        fetchTasks(projectId);
    }, [projectId, fetchProjectById, fetchTasks]);

    // Show spinner on first load before we have any project data.
    // We check !activeProject because isLoading briefly resets to false
    // between fetches, which would cause a flicker if used alone.
    if (!activeProject && isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#070b14]">
                <LoadingSpinner size="lg" label="Loading project..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-[#070b14]">
            <header className="flex items-center gap-4 px-6 h-14 border-b border-white/[0.06] shrink-0">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 text-white/30 hover:text-white/60 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Dashboard</span>
                </Link>

                <div className="w-px h-4 bg-white/10" />

                <h1 className="text-white font-semibold text-sm font-display truncate">
                    {activeProject?.name ?? "Loading..."}
                </h1>

                <nav className="flex items-center gap-1 ml-auto">
                    {tabs.map(({ label, icon: Icon, suffix }) => {
                        const fullHref = `/projects/${projectId}${suffix}`;
                        // Board tab matches exactly; Chat and Call match by prefix
                        const isActive =
                            suffix === "" ? pathname === fullHref : pathname.startsWith(fullHref);

                        return (
                            <Link
                                key={label}
                                href={fullHref}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                                    isActive
                                        ? "bg-white/10 text-white"
                                        : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </header>

            <div className="flex-1 overflow-hidden">{children}</div>
        </div>
    );
}