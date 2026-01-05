import axios from 'axios';

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
  upload: async (
    file: File,
    workspaceId: string,
    token: string,
  ): Promise<Media> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', workspaceId);

    const response = await axios.post(`${API_URL}/media/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  getAll: async (
    params: MediaQueryParams,
    token: string,
  ): Promise<MediaListResponse> => {
    const response = await axios.get(`${API_URL}/media`, {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  getById: async (
    id: string,
    workspaceId: string,
    token: string,
  ): Promise<Media> => {
    const response = await axios.get(`${API_URL}/media/${id}`, {
      params: { workspaceId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  update: async (
    id: string,
    workspaceId: string,
    data: UpdateMediaDto,
    token: string,
  ): Promise<Media> => {
    const response = await axios.patch(`${API_URL}/media/${id}`, data, {
      params: { workspaceId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  },

  delete: async (
    id: string,
    workspaceId: string,
    token: string,
  ): Promise<void> => {
    await axios.delete(`${API_URL}/media/${id}`, {
      params: { workspaceId },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  getMediaUrl: (storagePath: string): string => {
    return `${API_URL}/uploads/${storagePath}`;
  },
};
