import { useParams } from '@tanstack/react-router';
import { useWorkspace } from '@entities/workspace/api/workspace-queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { PageHeader } from '@shared/ui/page-header';
import { LoadingSpinner } from '@shared/ui/loading-spinner';

export function DashboardPage() {
  const { workspaceId } = useParams({ from: '/workspace/$workspaceId' });
  const { data: workspace, isLoading } = useWorkspace(workspaceId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome to ${workspace?.name || 'your workspace'}`}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Discovery</CardTitle>
            <CardDescription>Collect content sources</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ideas</CardTitle>
            <CardDescription>Organize your ideas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Drafts</CardTitle>
            <CardDescription>Write and edit content</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
