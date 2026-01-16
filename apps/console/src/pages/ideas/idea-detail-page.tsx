import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { PageHeader } from "@shared/ui/page-header";
import { Button } from "@shared/ui/button";
import { ideasApi } from "@shared/api/ideas";
import { LoadingSpinner } from "@shared/ui/loading-spinner";
import { Badge } from "@shared/ui/badge";

const statusLabels = {
  NEW: "New",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  DRAFTED: "Drafted",
};

export function IdeaDetailPage() {
  const { workspaceId, id } = useParams({
    from: "/workspace/$workspaceId/ideas/$id",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: idea, isLoading } = useQuery({
    queryKey: ["idea", id],
    queryFn: () => ideasApi.findOne(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => ideasApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas", workspaceId] });
      navigate({
        to: "/workspace/$workspaceId/ideas",
        params: { workspaceId },
      });
    },
  });

  if (!workspaceId) {
    return <div className="p-8">Please select a workspace first.</div>;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Idea" description="Loading idea" />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!idea) {
    return <div className="p-8">Idea not found.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={idea.title}
        description={idea.description || "No description provided"}
        action={
          <Button
            variant="ghost"
            onClick={() =>
              navigate({
                to: "/workspace/$workspaceId/ideas",
                params: { workspaceId },
              })
            }
          >
            Back to Ideas
          </Button>
        }
      />

      <div className="rounded-lg border bg-card p-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status</span>
          <Badge variant="secondary">
            {statusLabels[idea.status] ?? idea.status}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          Sources: {idea._count?.sources ?? idea.sources?.length ?? 0}
        </div>
        <div className="text-sm text-muted-foreground">
          Created by {idea.createdBy.name || idea.createdBy.email}
        </div>
        <div className="text-sm text-muted-foreground">
          Updated {new Date(idea.updatedAt).toLocaleString()}
        </div>
        <Button
          variant="destructive"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          Delete Idea
        </Button>
      </div>
    </div>
  );
}
