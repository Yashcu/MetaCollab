"use client";

// This component holds everything that requires React client context:
// Clerk's useUser, Zustand stores, Pusher realtime hooks, and theme.
// It's a client component so it can safely call these hooks.
// The layout passes userId down from the server so we don't need useUser() here.
import { useEffect } from "react";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { useInvitationRealtime } from "@/hooks/useInvitationRealtime";
import { useKickedFromProject } from "@/hooks/useKickedFromProject";
import { useTheme } from "@/hooks/useTheme";
import { useProjectStore } from "@/store/projectStore";
import { Sidebar } from "@/components/shared/Sidebar";

interface DashboardShellProps {
    userId: string;
    children: React.ReactNode;
}

export function DashboardShell({ userId, children }: DashboardShellProps) {
    const fetchProjects = useProjectStore((s) => s.fetchProjects);

    // Sync the active theme class onto <html> whenever the user's preference changes
    useTheme();

    // Subscribe to Pusher events on the user's private channel.
    // Mounted here (not in each page) so listeners survive navigation between pages.
    useDashboardRealtime(userId);
    useInvitationRealtime(userId);
    useKickedFromProject(userId);

    // Load the project list once when the dashboard mounts
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#070b14]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}