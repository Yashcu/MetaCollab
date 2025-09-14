import { useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useSocketStore } from "@/state/socketStore";
import { useProjectStore } from "@/state/projectStore";
import { getProjects } from "@/services/projectService";
export const useDashboardRealtime = () => {
  const { socket } = useSocketStore();
  const setProjects = useProjectStore(s => s.setProjects);

  useEffect(() => {
    if (!socket) return;
    const onRefetch = async () => {
      const projects = await getProjects();
      setProjects(projects);
      toast({ description: "Project list updated!" });
    };
    socket.on("dashboard:refetch", onRefetch);
    return () => {
      socket.off("dashboard:refetch", onRefetch);
    };
  }, [socket, setProjects]);
};
