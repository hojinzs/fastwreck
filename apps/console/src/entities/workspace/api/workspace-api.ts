import { apiClient } from '@shared/api/api-client';
import type {
  Workspace,
  WorkspaceWithRole,
  WorkspaceMember,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  InviteMemberRequest,
  UpdateMemberRoleRequest,
} from '../model/workspace.types';

export const workspaceApi = {
  // Workspace CRUD
  getWorkspaces: async (): Promise<WorkspaceWithRole[]> => {
    const response = await apiClient.get<WorkspaceWithRole[]>('/workspaces');
    return response.data;
  },

  getWorkspace: async (id: string): Promise<WorkspaceWithRole> => {
    const response = await apiClient.get<WorkspaceWithRole>(`/workspaces/${id}`);
    return response.data;
  },

  createWorkspace: async (data: CreateWorkspaceRequest): Promise<Workspace> => {
    const response = await apiClient.post<Workspace>('/workspaces', data);
    return response.data;
  },

  updateWorkspace: async (id: string, data: UpdateWorkspaceRequest): Promise<Workspace> => {
    const response = await apiClient.patch<Workspace>(`/workspaces/${id}`, data);
    return response.data;
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${id}`);
  },

  // Member management
  getMembers: async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const response = await apiClient.get<WorkspaceMember[]>(
      `/workspaces/${workspaceId}/members`
    );
    return response.data;
  },

  inviteMember: async (
    workspaceId: string,
    data: InviteMemberRequest
  ): Promise<WorkspaceMember> => {
    const response = await apiClient.post<WorkspaceMember>(
      `/workspaces/${workspaceId}/members`,
      data
    );
    return response.data;
  },

  updateMemberRole: async (
    workspaceId: string,
    memberId: string,
    data: UpdateMemberRoleRequest
  ): Promise<WorkspaceMember> => {
    const response = await apiClient.patch<WorkspaceMember>(
      `/workspaces/${workspaceId}/members/${memberId}`,
      data
    );
    return response.data;
  },

  removeMember: async (workspaceId: string, memberId: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`);
  },

  transferOwnership: async (
    workspaceId: string,
    newOwnerId: string
  ): Promise<{ message: string }> => {
    const response = await apiClient.post(
      `/workspaces/${workspaceId}/transfer-ownership`,
      { newOwnerId }
    );
    return response.data;
  },

  // Invitations
  createInvitation: async (
    workspaceId: string,
    data: { email: string; role: string }
  ): Promise<any> => {
    const response = await apiClient.post(
      `/workspaces/${workspaceId}/invitations`,
      data
    );
    return response.data;
  },

  getInvitations: async (workspaceId: string): Promise<any[]> => {
    const response = await apiClient.get(`/workspaces/${workspaceId}/invitations`);
    return response.data;
  },

  cancelInvitation: async (workspaceId: string, invitationId: string): Promise<void> => {
    await apiClient.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`);
  },

  getMyInvitations: async (): Promise<any[]> => {
    const response = await apiClient.get('/invitations/me');
    return response.data;
  },

  getInvitationByCode: async (code: string): Promise<any> => {
    const response = await apiClient.get(`/invitations/${code}`);
    return response.data;
  },

  acceptInvitation: async (code: string): Promise<any> => {
    const response = await apiClient.post(`/invitations/${code}/accept`);
    return response.data;
  },
};
