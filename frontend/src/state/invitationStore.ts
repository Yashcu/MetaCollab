import { create } from "zustand";
import { toast } from "@/components/ui/use-toast";
import {
  Invitation,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
} from "@/services/invitationService";
import { useEffect } from "react";
import { useSocketStore } from "./socketStore";

interface InvitationState {
  invitations: Invitation[];
  isLoading: boolean;
  fetchInvitations: () => Promise<void>;
  handleAccept: (invitationId: string) => Promise<void>;
  handleDecline: (invitationId: string) => Promise<void>;
}

export const useInvitationStore = create<InvitationState>((set) => ({
  invitations: [],
  isLoading: false,

  fetchInvitations: async () => {
    set({ isLoading: true });
    try {
      const invitations = await getMyInvitations();
      set({ invitations });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to fetch invitations",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  handleAccept: async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      // Remove the invitation from the list for an instant UI update
      set((state) => ({
        invitations: state.invitations.filter((inv) => inv.id !== invitationId),
      }));
      toast({
        title: "Invitation Accepted!",
        description: "You have been added to the project.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not accept the invitation.",
      });
    }
  },

  handleDecline: async (invitationId: string) => {
    try {
      await declineInvitation(invitationId);
      // Remove the invitation from the list
      set((state) => ({
        invitations: state.invitations.filter((inv) => inv.id !== invitationId),
      }));
      toast({ title: "Invitation Declined" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not decline the invitation.",
      });
    }
  },
}));

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
