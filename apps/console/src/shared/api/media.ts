import { apiClient } from './api-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface Media {
  id: string;
  workspaceId: string;
  uploadedById: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: 'IMAGE' | 'VIDEO';
  description?: string;
  tags: string[];
  storageType: string;
  storagePath: string;
  variants?: any;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface MediaListResponse {
  data: Media[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MediaQueryParams {
  workspaceId: string;
  search?: string;
  type?: 'IMAGE' | 'VIDEO';
  page?: number;
  limit?: number;
}

export interface UpdateMediaDto {
  description?: string;
  tags?: string[];
}

export const mediaApi = {
  upload: async (file: File, workspaceId: string): Promise<Media> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', workspaceId);

    const response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  getAll: async (params: MediaQueryParams): Promise<MediaListResponse> => {
    const response = await apiClient.get('/media', { params });
    return response.data;
  },

  getById: async (id: string, workspaceId: string): Promise<Media> => {
    const response = await apiClient.get(`/media/${id}`, {
      params: { workspaceId },
    });
    return response.data;
  },

  update: async (
    id: string,
    workspaceId: string,
    data: UpdateMediaDto,
  ): Promise<Media> => {
    const response = await apiClient.patch(`/media/${id}`, data, {
      params: { workspaceId },
    });
    return response.data;
  },

  delete: async (id: string, workspaceId: string): Promise<void> => {
    await apiClient.delete(`/media/${id}`, {
      params: { workspaceId },
    });
  },

  getMediaUrl: (storagePath: string): string => {
    return `${API_URL}/uploads/${storagePath}`;
  },
};
