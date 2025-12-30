import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from './user-api';
import type { LoginRequest, RegisterRequest } from '../model/user.types';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
};

// Auth hooks
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => userApi.login(data),
    onSuccess: (response) => {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      queryClient.setQueryData(userKeys.profile(), response.user);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterRequest) => userApi.register(data),
    onSuccess: (response) => {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      queryClient.setQueryData(userKeys.profile(), response.user);
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: userApi.getProfile,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useOidcAuthUrl() {
  return useQuery({
    queryKey: ['oidc', 'auth-url'],
    queryFn: userApi.getOidcAuthUrl,
    enabled: false, // Manual trigger only
  });
}

export function useOidcCallback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => userApi.handleOidcCallback(code),
    onSuccess: (response) => {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      queryClient.setQueryData(userKeys.profile(), response.user);
    },
  });
}

// User management hooks
export function useUsers() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: userApi.getUsers,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userApi.getUser(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<any> }) =>
      userApi.updateUser(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    queryClient.clear();
    window.location.href = '/login';
  };
}
