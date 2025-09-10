import api from './api';
import { Project, User } from '@/types';

export interface Invitation {
  id: string;
  project: Pick<Project, 'id' | 'name'>;
  inviter: Pick<User, 'id' | 'name' | 'email'>;
  status: 'pending' | 'accepted' | 'declined';
}

export const getMyInvitations = async (): Promise<Invitation[]> => {
  const response = await api.get('/invitations');
  return response.data.data;
};

export const acceptInvitation = async (invitationId: string): Promise<void> => {
  await api.post(`/invitations/${invitationId}/accept`);
};

export const declineInvitation = async (invitationId: string): Promise<void> => {
  await api.post(`/invitations/${invitationId}/decline`);
};
