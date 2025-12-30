import { apiClient } from '@shared/api/api-client';
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../model/user.types';

export const userApi = {
  // Auth endpoints
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data;
  },

  // OIDC endpoints
  getOidcAuthUrl: async (): Promise<{ url: string }> => {
    const response = await apiClient.get<{ url: string }>('/auth/oidc');
    return response.data;
  },

  handleOidcCallback: async (code: string): Promise<LoginResponse> => {
    const response = await apiClient.get<LoginResponse>(`/auth/oidc/callback?code=${code}`);
    return response.data;
  },

  // User management
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get<User[]>('/users');
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  // Profile management
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me', data);
    return response.data;
  },

  getMyWorkspaces: async (): Promise<any[]> => {
    const response = await apiClient.get('/users/me/workspaces');
    return response.data;
  },

  leaveWorkspace: async (workspaceId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/users/me/workspaces/${workspaceId}`);
    return response.data;
  },

  // Password reset
  forgotPassword: async (email: string): Promise<{ mailSent: boolean }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetToken: async (token: string): Promise<{ valid: boolean; email: string }> => {
    const response = await apiClient.get(`/auth/verify-reset-token?token=${token}`);
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};
