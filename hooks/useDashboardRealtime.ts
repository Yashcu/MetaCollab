"use client";

import { useCallback } from "react";
import { usePusher } from "@/components/realtime/usePusher";
import { useProjectStore } from "@/store/projectStore";
import { getProjects } from "@/services/projectService";
import { toast } from "sonner";

/**
 * Listen for dashboard:refetch events on the user's personal channel.
 * When triggered, re-fetches the project list and updates the store.
*/
export const useDashboardRealtime = (
  userId: string | undefined | null
): void => {
  const setProjects = useProjectStore((s) => s.setProjects);

  const handleRefetch = useCallback(async () => {
    if (!userId) return;

    try {
      const projects = await getProjects();
      setProjects(projects);
      toast.info("Project list updated");
    } catch (error) {
      console.error("[useDashboardRealtime] Failed to refetch projects:", error);
    }
  }, [userId, setProjects]);

  usePusher(
    userId ? `private-user-${userId}` : "",
    "dashboard:refetch",
    handleRefetch
  );
};