import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import { useWorkspace, useUpdateWorkspace } from '@entities/workspace/api/workspace-queries';
import {
  updateWorkspaceSchema,
  type UpdateWorkspaceFormData,
} from '@entities/workspace/model/workspace.types';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { PageHeader } from '@shared/ui/page-header';
import { LoadingSpinner } from '@shared/ui/loading-spinner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@shared/ui/form';

export function SettingsPage() {
  const { workspaceId } = useParams({ from: '/workspace/$workspaceId/settings' });
  const { data: workspace, isLoading } = useWorkspace(workspaceId);
  const updateWorkspaceMutation = useUpdateWorkspace();

  const form = useForm<UpdateWorkspaceFormData>({
    resolver: zodResolver(updateWorkspaceSchema),
    values: workspace
      ? {
          name: workspace.name,
          description: workspace.description || '',
        }
      : undefined,
  });

  const onSubmit = async (data: UpdateWorkspaceFormData) => {
    try {
      await updateWorkspaceMutation.mutateAsync({
        id: workspaceId,
        data,
      });
      toast.success('Workspace updated successfully!');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update workspace');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workspace Settings" description="Manage your workspace settings" />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Workspace Settings" description="Manage your workspace settings" />

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Update your workspace name and description</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workspace Name</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {updateWorkspaceMutation.isError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {(updateWorkspaceMutation.error as any)?.response?.data?.message ||
                    'Failed to update workspace. Please try again.'}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={updateWorkspaceMutation.isPending}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={updateWorkspaceMutation.isPending}>
                  {updateWorkspaceMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workspace Information</CardTitle>
          <CardDescription>Read-only workspace details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <span className="text-sm font-medium">Workspace ID:</span>
            <span className="ml-2 font-mono text-sm text-muted-foreground">
              {workspace?.id}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium">Slug:</span>
            <span className="ml-2 font-mono text-sm text-muted-foreground">
              {workspace?.slug}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium">Your Role:</span>
            <span className="ml-2 text-sm font-medium text-primary">{workspace?.role}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
