import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ideasApi } from "@shared/api/ideas";
import type { CreateIdeaDto, UpdateIdeaDto } from "@shared/api/ideas";

export const ideaKeys = {
  all: ["ideas"] as const,
  lists: (workspaceId: string) =>
    [...ideaKeys.all, "list", workspaceId] as const,
  detail: (id: string) => [...ideaKeys.all, "detail", id] as const,
};

export function useIdeas(
  workspaceId: string,
  filters?: { status?: string; search?: string },
) {
  return useQuery({
    queryKey: [...ideaKeys.lists(workspaceId), filters],
    queryFn: () =>
      ideasApi.findAll({
        workspaceId,
        status: filters?.status as any,
        search: filters?.search,
      }),
    enabled: !!workspaceId,
  });
}

export function useIdea(id: string) {
  return useQuery({
    queryKey: ideaKeys.detail(id),
    queryFn: () => ideasApi.findOne(id),
    enabled: !!id,
  });
}

export function useCreateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateIdeaDto) => ideasApi.create(dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ideaKeys.lists(variables.workspaceId),
      });
    },
  });
}

export function useUpdateIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateIdeaDto }) =>
      ideasApi.update(id, dto),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ideaKeys.detail(variables.id),
      });
    },
  });
}

export function useDeleteIdea(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ideasApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ideaKeys.lists(workspaceId) });
    },
  });
}
