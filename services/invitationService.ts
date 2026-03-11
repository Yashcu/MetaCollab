import { fetchJson } from "./fetcher";

// Invitation data returned from the API
export interface Invitation {
  id: string;
  project: string;
  inviter: string;
  recipient: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt: string;
  createdAt: string;
}

// Get all invitations for the current user
export const getMyInvitations = async (): Promise<Invitation[]> => {
  return fetchJson<Invitation[]>("/api/invitations", { method: "GET" });
};

// Accept an invitation and join the project
export const acceptInvitation = async (
  invitationId: string
): Promise<void> => {
  return fetchJson<void>(`/api/invitations/${invitationId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "accept" }),
  });
};

// Decline an invitation
export const declineInvitation = async (
  invitationId: string
): Promise<void> => {
  return fetchJson<void>(`/api/invitations/${invitationId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "decline" }),
  });
};

// Send a project invitation via email
export const inviteMember = async (
  projectId: string,
  email: string
): Promise<void> => {
  await fetchJson<void>("/api/invitations", {
    method: "POST",
    body: JSON.stringify({ projectId, email }),
  });
};