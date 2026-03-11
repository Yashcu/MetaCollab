"use client";

import { useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { useProjectStore } from "@/store/projectStore";
import { toast } from "sonner"; // sonner — not the old use-toast hook

// Typed payload from the server's "kicked:from_project" event
interface KickedPayload {
  projectId: string;
  projectName?: string;
}

/**
 * Listen for "kicked:from_project" events on the user's personal channel.
 * When triggered, shows a toast and redirects to the dashboard.
 */
export const useKickedFromProject = (
  userId: string | undefined | null
): void => {
  const clearProject = useProjectStore((s) => s.clearProject);
  const clearProjectRef = useRef(clearProject);

  useEffect(() => {
    clearProjectRef.current = clearProject;
  });

  useEffect(() => {
    if (!userId) return;

    const channelName = `private-user-${userId}`;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    const handleKicked = (data: KickedPayload) => {
      const projectName = data.projectName ?? "a project";

      // Show the notification first
      toast.error("Removed from project", {
        description: `You have been removed from "${projectName}".`,
      });

      clearProjectRef.current();

      window.location.replace("/dashboard");
    };

    channel.bind("kicked:from_project", handleKicked);

    return () => {
      channel.unbind("kicked:from_project", handleKicked);
      pusher.unsubscribe(channelName);
    };
  }, [userId]);
};