import { toast } from "@/components/ui/use-toast";
import { useEffect } from "react";
import { useInvitationStore } from "@/state/invitationStore";
import { useSocketStore } from "@/state/socketStore";

export const useInvitationRealtime = () => {
  const { socket } = useSocketStore();
  const fetchInvitations = useInvitationStore(state => state.fetchInvitations);
  useEffect(() => {
    if (!socket) return;

    const onNewInvite = () => {
      fetchInvitations();
      toast({ title: "New Project Invitation", description: "You have received a new invitation!" });
    };

    const onAccepted = ({ projectName, recipientName }: { projectName: string; recipientName: string }) => {
      toast({
        title: "Invitation Accepted",
        description: `${recipientName} joined "${projectName}"!`
      });
    };

    const onDeclined = ({ projectName, recipientName }: { projectName: string; recipientName: string }) => {
      toast({
        variant: "destructive",
        title: "Invitation Declined",
        description: `${recipientName} declined "${projectName}."`
      });
    };

    socket.on("invitation:new", onNewInvite);
    socket.on("invitation:accepted", onAccepted);
    socket.on("invitation:declined", onDeclined);

    return () => {
      socket.off("invitation:new", onNewInvite);
      socket.off("invitation:accepted", onAccepted);
      socket.off("invitation:declined", onDeclined);
    };
  }, [socket, fetchInvitations]);
};
