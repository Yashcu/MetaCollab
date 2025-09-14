import { useEffect } from "react";
import { useSocketStore } from "@/state/socketStore";
import { toast } from "@/components/ui/use-toast";

export const useKickedFromProject = () => {
  const { socket } = useSocketStore();
  useEffect(() => {
  if (!socket) return;
  const onKicked = ({ projectName }: { projectName: string }) => { // see fix for 2nd error!
    toast({
      variant: "destructive",
      title: "Removed from Project",
      description: `You have been removed from "${projectName}".`,
    });
    window.location.replace("/dashboard");
  };
  socket.on("kicked:from_project", onKicked);
  return () => {
    socket.off("kicked:from_project", onKicked);
  };
}, [socket]);
};
