import { create } from "zustand";
import { toast } from "sonner";
import {
  type Invitation,
  getMyInvitations,
  acceptInvitation,
  declineInvitation,
} from "@/services/invitationService";

interface InvitationState {
  invitations: Invitation[];
  isLoading: boolean;
  error: string | null;
  fetchInvitations: () => Promise<void>;
  handleAccept: (invitationId: string) => Promise<void>;
  handleDecline: (invitationId: string) => Promise<void>;
  reset: () => void;
}

export const useInvitationStore = create<InvitationState>((set, get) => ({
  invitations: [],
  isLoading: false,
  error: null,

  // Fetch all pending invitations for the current user
  fetchInvitations: async () => {
    set({ isLoading: true, error: null });
    try {
      const invitations = await getMyInvitations();
      set({ invitations });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load invitations";
      set({ error: message });
      toast.error("Could not load invitations", { description: message });
    } finally {
      set({ isLoading: false });
    }
  },

  // Accept an invitation and join the project
  handleAccept: async (invitationId: string) => {
    const previousInvitations = get().invitations;

    set((state) => ({
      invitations: state.invitations.filter((inv) => inv.id !== invitationId),
    }));

    try {
      await acceptInvitation(invitationId);
      toast.success("Invitation accepted!", {
        description: "You have been added to the project.",
      });
    } catch (error) {
      set({ invitations: previousInvitations });

      const message =
        error instanceof Error ? error.message : "Could not accept invitation";
      toast.error("Action failed", { description: message });
    }
  },

  // Decline an invitation
  handleDecline: async (invitationId: string) => {
    const previousInvitations = get().invitations;

    set((state) => ({
      invitations: state.invitations.filter((inv) => inv.id !== invitationId),
    }));

    try {
      await declineInvitation(invitationId);
      toast.success("Invitation declined");
    } catch (error) {
      set({ invitations: previousInvitations });

      const message =
        error instanceof Error ? error.message : "Could not decline invitation";
      toast.error("Action failed", { description: message });
    }
  },

  reset: () => set({ invitations: [], isLoading: false, error: null }),
}));