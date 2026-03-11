"use client";

import { useEffect, useRef } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { useInvitationStore } from "@/store/invitationStore";
import { toast } from "sonner";

interface InvitationAcceptedPayload {
  projectId: string;
  recipientId: string;
  projectName?: string;
  recipientName?: string;
}

interface InvitationDeclinedPayload {
  projectId: string;
  recipientId: string;
  projectName?: string;
  recipientName?: string;
}

// ---------------------------------------------------------------------------
// useInvitationRealtime
//
// WHY we don't use usePusher 3 times here:
// Calling usePusher 3 times on the same channel causes a race condition.
// Pusher deduplicates channel subscriptions, but each usePusher call
// independently unsubscribes the channel when it cleans up. The first
// component to unmount unsubscribes the channel and the other two lose
// their events. Fix: subscribe ONCE and bind all three events manually.
// ---------------------------------------------------------------------------

/**
 * Listen for invitation-related events on the user's personal channel.
 * Handles new invitations, acceptances, and declines.
*/
export const useInvitationRealtime = (
  userId: string | undefined | null
): void => {
  const fetchInvitations = useInvitationStore((s) => s.fetchInvitations);

  // Store fetchInvitations in a ref so the effect doesn't need it as a dep
  const fetchInvitationsRef = useRef(fetchInvitations);
  useEffect(() => {
    fetchInvitationsRef.current = fetchInvitations;
  });

  useEffect(() => {
    // Don't subscribe if userId is not available yet
    if (!userId) return;

    const channelName = `private-user-${userId}`;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(channelName);

    // Event 1: Someone sent us a new invitation
    const handleNewInvitation = () => {
      // Re-fetch the invitations list so the new one appears
      fetchInvitationsRef.current();
      toast.info("New project invitation", {
        description: "You have received a new project invitation!",
      });
    };

    // Event 2: Someone accepted our invitation to join our project
    const handleAccepted = (data: InvitationAcceptedPayload) => {
      const name = data.recipientName ?? "Someone";
      const project = data.projectName ?? "The Project";
      toast.success("Invitation accepted", {
        description: `${name} joined "${project}"!`,
      });
    };

    // Event 3: Someone declined our invitation
    const handleDeclined = (data: InvitationDeclinedPayload) => {
      const name = data.recipientName ?? "Someone";
      const project = data.projectName ?? "The Project";
      toast.error("Invitation declined", {
        description: `${name} declined the invitation to "${project}".`,
      });
    };

    // Bind all three events to the same channel subscription
    channel.bind("invitation:new", handleNewInvitation);
    channel.bind("invitation:accepted", handleAccepted);
    channel.bind("invitation:declined", handleDeclined);

    // Cleanup: unbind all three handlers and unsubscribe ONCE
    return () => {
      channel.unbind("invitation:new", handleNewInvitation);
      channel.unbind("invitation:accepted", handleAccepted);
      channel.unbind("invitation:declined", handleDeclined);
      pusher.unsubscribe(channelName);
    };
  }, [userId]);
};