import { fetchJson } from "./fetcher";

/** An invitation document as returned by the API */
export interface Invitation {
  id: string;
  project: string;
  inviter: string;
  recipient: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt: string;
  createdAt: string;
}

/**
 * Fetch all pending invitations for the currently logged-in user.
 * Matched by the user's email address.
 */
export const getMyInvitations = async (): Promise<Invitation[]> => {
  return fetchJson<Invitation[]>("/api/invitations", { method: "GET" });
};

/**
 * Accept a pending invitation.
 * This adds the current user to the project's members list.
*/
export const acceptInvitation = async (
  invitationId: string
): Promise<void> => {
  return fetchJson<void>(`/api/invitations/${invitationId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "accept" }),
  });
};

/**
 * Decline a pending invitation.
 * The invitation status is set to "declined" and no project access is granted.
*/
export const declineInvitation = async (
  invitationId: string
): Promise<void> => {
  return fetchJson<void>(`/api/invitations/${invitationId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "decline" }),
  });
};