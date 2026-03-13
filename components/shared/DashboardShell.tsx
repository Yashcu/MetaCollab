"use client";

// This component holds everything that requires React client context:
// Clerk's useUser, Zustand stores, Pusher realtime hooks, and theme.
import { useEffect, useRef, useCallback } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { useTheme } from "@/hooks/useTheme";
import { useProjectStore } from "@/store/projectStore";
import { useInvitationStore } from "@/store/invitationStore";
import { getProjects } from "@/services/projectService";
import { toast } from "sonner";
import { Sidebar } from "@/components/shared/Sidebar";

interface DashboardShellProps {
    userId: string;
    children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// BUG FIX: DashboardShell previously composed three separate hooks:
//   useDashboardRealtime  -> usePusher(private-user-X, "dashboard:refetch")
//   useInvitationRealtime -> raw subscribe(private-user-X) + 3 binds
//   useKickedFromProject  -> raw subscribe(private-user-X) + 1 bind
//
// The problem: usePusher calls pusher.unsubscribe(channelName) in its cleanup.
// Pusher tracks subscription reference counts — unsubscribe() decrements the count
// and closes the channel when it hits zero. So whichever hook cleaned up first
// would close the shared private-user-{userId} channel, silently dropping all
// events for the remaining hooks.
//
// Fix: subscribe to the channel ONCE here and bind all 5 events manually.
// One subscribe, one unsubscribe — no race condition.
// ---------------------------------------------------------------------------

export function DashboardShell({ userId, children }: DashboardShellProps) {
    const fetchProjects = useProjectStore((s) => s.fetchProjects);
    const setProjects = useProjectStore((s) => s.setProjects);
    const clearProject = useProjectStore((s) => s.clearProject);
    const fetchInvitations = useInvitationStore((s) => s.fetchInvitations);

    // Store callbacks in refs so the single useEffect doesn't need them as deps
    const setProjectsRef = useRef(setProjects);
    const clearProjectRef = useRef(clearProject);
    const fetchInvitationsRef = useRef(fetchInvitations);

    useEffect(() => { setProjectsRef.current = setProjects; });
    useEffect(() => { clearProjectRef.current = clearProject; });
    useEffect(() => { fetchInvitationsRef.current = fetchInvitations; });

    // Sync theme class onto <html>
    useTheme();

    // Load projects once on mount
    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // Single Pusher subscription for the user's private channel
    // Handles all 5 real-time events that were previously split across 3 hooks
    const handleDashboardRefetch = useCallback(async () => {
        try {
            const projects = await getProjects();
            setProjectsRef.current(projects);
            toast.info("Project list updated");
        } catch (error) {
            console.error("[DashboardShell] Failed to refetch projects:", error);
        }
    }, []);

    useEffect(() => {
        if (!userId) return;

        const channelName = `private-user-${userId}`;
        const pusher = getPusherClient();
        const channel = pusher.subscribe(channelName);

        // Event 1: dashboard refresh (previously in useDashboardRealtime)
        channel.bind("dashboard:refetch", handleDashboardRefetch);

        // Event 2-4: invitation events (previously in useInvitationRealtime)
        const handleNewInvitation = () => {
            fetchInvitationsRef.current();
            toast.info("New project invitation", {
                description: "You have received a new project invitation!",
            });
        };

        const handleInvitationAccepted = (data: {
            projectName?: string;
            recipientName?: string;
        }) => {
            const name = data.recipientName ?? "Someone";
            const project = data.projectName ?? "The Project";
            toast.success("Invitation accepted", {
                description: `${name} joined "${project}"!`,
            });
        };

        const handleInvitationDeclined = (data: {
            projectName?: string;
            recipientName?: string;
        }) => {
            const name = data.recipientName ?? "Someone";
            const project = data.projectName ?? "The Project";
            toast.error("Invitation declined", {
                description: `${name} declined the invitation to "${project}".`,
            });
        };

        channel.bind("invitation:new", handleNewInvitation);
        channel.bind("invitation:accepted", handleInvitationAccepted);
        channel.bind("invitation:declined", handleInvitationDeclined);

        // Event 5: kicked from project (previously in useKickedFromProject)
        const handleKicked = (data: { projectId: string; projectName?: string }) => {
            const projectName = data.projectName ?? "a project";
            toast.error("Removed from project", {
                description: `You have been removed from "${projectName}".`,
            });
            clearProjectRef.current();
            window.location.replace("/dashboard");
        };

        channel.bind("kicked:from_project", handleKicked);

        // ONE unsubscribe on cleanup — no race condition
        return () => {
            channel.unbind("dashboard:refetch", handleDashboardRefetch);
            channel.unbind("invitation:new", handleNewInvitation);
            channel.unbind("invitation:accepted", handleInvitationAccepted);
            channel.unbind("invitation:declined", handleInvitationDeclined);
            channel.unbind("kicked:from_project", handleKicked);
            pusher.unsubscribe(channelName);
        };
    }, [userId, handleDashboardRefetch]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#070b14]">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}