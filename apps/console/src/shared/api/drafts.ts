import { apiClient } from './api-client';

export interface Draft {
  id: string;
  title: string;
  currentVersion: number;
  status: 'DRAFT' | 'REVIEW' | 'READY' | 'PUBLISHED';
  tempContent: any | null; // Temporary content (auto-saved)
  tempContentSavedAt: string | null; // When temp content was saved
  workspaceId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
  versions?: DraftVersion[];
  _count?: {
    versions: number;
  };
}

export interface DraftVersion {
  id: string;
  version: number;
  content: any; // Tiptap JSON
  contentHtml: string | null;
  contentMarkdown: string | null;
  changeSummary: string | null;
  draftId: string;
  createdById: string;
  createdAt: string;
  createdBy: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

export interface CreateDraftDto {
  title: string;
  workspaceId: string;
  content?: any;
  changeSummary?: string;
}

export interface UpdateDraftDto {
  title?: string;
  status?: 'DRAFT' | 'REVIEW' | 'READY' | 'PUBLISHED';
}

export interface CreateVersionDto {
  content: any;
  contentHtml?: string;
  contentMarkdown?: string;
  changeSummary?: string;
}

export const draftsApi = {
  create: async (dto: CreateDraftDto): Promise<Draft> => {
    const response = await apiClient.post('/drafts', dto);
    return response.data;
  },

  findAll: async (workspaceId: string): Promise<Draft[]> => {
    const response = await apiClient.get('/drafts', {
      params: { workspaceId },
    });
    return response.data;
  },

  findOne: async (id: string): Promise<Draft> => {
    const response = await apiClient.get(`/drafts/${id}`);
    return response.data;
  },

  update: async (id: string, dto: UpdateDraftDto): Promise<Draft> => {
    const response = await apiClient.patch(`/drafts/${id}`, dto);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/drafts/${id}`);
  },

  getVersions: async (draftId: string): Promise<DraftVersion[]> => {
    const response = await apiClient.get(`/drafts/${draftId}/versions`);
    return response.data;
  },

  getVersion: async (
    draftId: string,
    version: number
  ): Promise<DraftVersion> => {
    const response = await apiClient.get(
      `/drafts/${draftId}/versions/${version}`
    );
    return response.data;
  },

  createVersion: async (
    draftId: string,
    dto: CreateVersionDto
  ): Promise<DraftVersion> => {
    const response = await apiClient.post(`/drafts/${draftId}/versions`, dto);
    return response.data;
  },

  revertToVersion: async (
    draftId: string,
    version: number
  ): Promise<DraftVersion> => {
    const response = await apiClient.post(
      `/drafts/${draftId}/revert/${version}`
    );
    return response.data;
  },

  saveTempContent: async (draftId: string, content: any): Promise<Draft> => {
    const response = await apiClient.patch(`/drafts/${draftId}/temp`, {
      content,
    });
    return response.data;
  },

  discardTempContent: async (draftId: string): Promise<Draft> => {
    const response = await apiClient.delete(`/drafts/${draftId}/temp`);
    return response.data;
  },

  commitTempContent: async (draftId: string): Promise<DraftVersion> => {
    const response = await apiClient.post(`/drafts/${draftId}/temp/commit`);
    return response.data;
  },
};
