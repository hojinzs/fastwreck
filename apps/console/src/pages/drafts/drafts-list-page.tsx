import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { draftsApi, Draft } from '@shared/api/drafts';
import { Link, useParams } from '@tanstack/react-router';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@shared/ui/page-header';
import { Button } from '@shared/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/ui/table';
import { Badge } from '@shared/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/ui/alert-dialog';
import { LoadingSpinner } from '@shared/ui/loading-spinner';
import { EmptyState } from '@shared/ui/empty-state';

const statusVariants = {
  DRAFT: { variant: 'secondary' as const, label: 'Draft' },
  REVIEW: { variant: 'default' as const, label: 'Review' },
  READY: { variant: 'default' as const, label: 'Ready' },
  PUBLISHED: { variant: 'default' as const, label: 'Published' },
};

export function DraftsListPage() {
  const { workspaceId } = useParams({ from: '/workspace/$workspaceId/drafts' });
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);

  const { data: drafts, isLoading } = useQuery({
    queryKey: ['drafts', workspaceId],
    queryFn: () => draftsApi.findAll(workspaceId),
    enabled: !!workspaceId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => draftsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
      toast.success('Draft deleted successfully');
      setDeleteDialogOpen(false);
      setDraftToDelete(null);
    },
    onError: () => {
      toast.error('Failed to delete draft');
    },
  });

  const handleDeleteClick = (id: string) => {
    setDraftToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (draftToDelete) {
      deleteMutation.mutate(draftToDelete);
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
        <PageHeader
          title="Drafts"
          description="Manage your draft content"
        />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drafts"
        description="Manage your draft content"
        action={
          <Button asChild>
            <Link to="/workspace/$workspaceId/drafts/new" params={{ workspaceId }}>
              New Draft
            </Link>
          </Button>
        }
      />

      {drafts && drafts.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Created by</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((draft: Draft) => (
                <TableRow key={draft.id}>
                  <TableCell>
                    <Link
                      to="/workspace/$workspaceId/drafts/$id"
                      params={{ workspaceId, id: draft.id }}
                      className="font-medium text-primary hover:underline"
                    >
                      {draft.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[draft.status]?.variant || 'secondary'}>
                      {statusVariants[draft.status]?.label || draft.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    v{draft.currentVersion}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {draft.createdBy.name || draft.createdBy.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(draft.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to="/workspace/$workspaceId/drafts/$id"
                          params={{ workspaceId, id: draft.id }}
                        >
                          Edit
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(draft.id)}
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
          icon={FileText}
          title="No drafts yet"
          description="Get started by creating your first draft"
          action={
            <Button asChild>
              <Link to="/workspace/$workspaceId/drafts/new" params={{ workspaceId }}>
                Create your first draft
              </Link>
            </Button>
          }
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the draft.
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
