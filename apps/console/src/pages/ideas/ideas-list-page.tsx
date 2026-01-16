import { useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { ideasApi, Idea } from "@shared/api/ideas";
import { PageHeader } from "@shared/ui/page-header";
import { Button } from "@shared/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { LoadingSpinner } from "@shared/ui/loading-spinner";
import { EmptyState } from "@shared/ui/empty-state";

const statusVariants = {
  NEW: { variant: "secondary" as const, label: "New" },
  IN_REVIEW: { variant: "default" as const, label: "In Review" },
  APPROVED: { variant: "default" as const, label: "Approved" },
  DRAFTED: { variant: "default" as const, label: "Drafted" },
};

export function IdeasListPage() {
  const { workspaceId } = useParams({ from: "/workspace/$workspaceId/ideas" });
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);

  const { data: ideas, isLoading } = useQuery({
    queryKey: ["ideas", workspaceId],
    queryFn: () => ideasApi.findAll({ workspaceId }),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ideasApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      toast.success("Idea deleted successfully");
      setDeleteDialogOpen(false);
      setIdeaToDelete(null);
    },
    onError: () => {
      toast.error("Failed to delete idea");
    },
  });

  const handleDeleteClick = (id: string) => {
    setIdeaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (ideaToDelete) {
      deleteMutation.mutate(ideaToDelete);
    }
  };

  if (!workspaceId) {
    return (
      <div className="p-8">
        <p>Please select a workspace first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ideas" description="Organize your content ideas" />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ideas"
        description="Organize your content ideas"
        action={
          <Button asChild>
            <Link
              to="/workspace/$workspaceId/ideas/new"
              params={{ workspaceId }}
            >
              New Idea
            </Link>
          </Button>
        }
      />

      {ideas && ideas.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ideas.map((idea: Idea) => (
                <TableRow key={idea.id}>
                  <TableCell>
                    <Link
                      to="/workspace/$workspaceId/ideas/$id"
                      params={{ workspaceId, id: idea.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {idea.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        statusVariants[idea.status]?.variant || "secondary"
                      }
                    >
                      {statusVariants[idea.status]?.label || idea.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {idea._count?.sources ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {idea.createdBy.name || idea.createdBy.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(idea.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to="/workspace/$workspaceId/ideas/$id"
                          params={{ workspaceId, id: idea.id }}
                        >
                          View
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(idea.id)}
                        disabled={deleteMutation.isPending}
                        className="text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Lightbulb}
          title="No ideas yet"
          description="Capture your first idea from discoveries"
          action={
            <Button asChild>
              <Link
                to="/workspace/$workspaceId/ideas/new"
                params={{ workspaceId }}
              >
                Create your first idea
              </Link>
            </Button>
          }
        />
      )}

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setIdeaToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              idea.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
