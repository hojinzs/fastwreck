import { apiClient } from "./api-client";

export type IdeaStatus = "NEW" | "IN_REVIEW" | "APPROVED" | "DRAFTED";
export type IdeaSourceType = "RSS" | "YOUTUBE" | "MANUAL";

export interface IdeaSource {
  id: string;
  ideaId: string;
  url: string | null;
  content: string;
  sourceType: IdeaSourceType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
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
  sources?: IdeaSource[];
  _count?: {
    sources: number;
  };
}

export interface CreateIdeaDto {
  title: string;
  description?: string;
  workspaceId: string;
  status?: IdeaStatus;
}

export interface UpdateIdeaDto {
  title?: string;
  description?: string;
  status?: IdeaStatus;
}

export interface CreateIdeaSourceDto {
  url?: string;
  content: string;
  sourceType?: IdeaSourceType;
  metadata?: Record<string, unknown>;
}

export interface IdeasQueryParams {
  workspaceId: string;
  status?: IdeaStatus;
  search?: string;
}

export const ideasApi = {
  create: async (dto: CreateIdeaDto): Promise<Idea> => {
    const response = await apiClient.post("/ideas", dto);
    return response.data;
  },

  findAll: async (params: IdeasQueryParams): Promise<Idea[]> => {
    const response = await apiClient.get("/ideas", { params });
    return response.data;
  },

  findOne: async (id: string): Promise<Idea> => {
    const response = await apiClient.get(`/ideas/${id}`);
    return response.data;
  },

  update: async (id: string, dto: UpdateIdeaDto): Promise<Idea> => {
    const response = await apiClient.patch(`/ideas/${id}`, dto);
    return response.data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/ideas/${id}`);
  },

  addSource: async (
    ideaId: string,
    dto: CreateIdeaSourceDto,
  ): Promise<IdeaSource> => {
    const response = await apiClient.post(`/ideas/${ideaId}/sources`, dto);
    return response.data;
  },

  getSources: async (ideaId: string): Promise<IdeaSource[]> => {
    const response = await apiClient.get(`/ideas/${ideaId}/sources`);
    return response.data;
  },

  removeSource: async (ideaId: string, sourceId: string): Promise<void> => {
    await apiClient.delete(`/ideas/${ideaId}/sources/${sourceId}`);
  },
};
