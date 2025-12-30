import { useState, useEffect } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { userApi } from '@entities/user/api/user-api';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';

export function MyWorkspacesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const data = await userApi.getMyWorkspaces();
      setWorkspaces(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async (workspaceId: string, workspaceName: string) => {
    if (!confirm(`Are you sure you want to leave "${workspaceName}"?`)) {
      return;
    }

    setLeavingId(workspaceId);
    setError(null);

    try {
      await userApi.leaveWorkspace(workspaceId);
      await loadWorkspaces();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to leave workspace');
    } finally {
      setLeavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">Loading workspaces...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>My Workspaces</CardTitle>
          <CardDescription>
            Workspaces you are a member of
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {workspaces.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="mb-4">You are not a member of any workspaces</p>
              <Button onClick={() => navigate({ to: '/workspaces' })}>
                Browse workspaces
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Link
                        to="/workspaces/$id"
                        params={{ id: workspace.id }}
                        className="font-medium text-lg hover:underline"
                      >
                        {workspace.name}
                      </Link>
                      {workspace.description && (
                        <div className="text-sm text-muted-foreground">
                          {workspace.description}
                        </div>
                      )}
                    </div>
                    <div className="text-sm px-2 py-1 bg-muted rounded capitalize">
                      {workspace.myRole.toLowerCase()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Owner</div>
                      <div className="font-medium">
                        {workspace.owner.name || workspace.owner.email}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Joined</div>
                      <div className="font-medium">
                        {new Date(workspace.joinedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link to="/workspaces/$id" params={{ id: workspace.id }}>
                      <Button variant="outline">View workspace</Button>
                    </Link>
                    {workspace.myRole !== 'OWNER' && (
                      <Button
                        variant="destructive"
                        onClick={() => handleLeave(workspace.id, workspace.name)}
                        disabled={leavingId === workspace.id}
                      >
                        {leavingId === workspace.id ? 'Leaving...' : 'Leave'}
                      </Button>
                    )}
                    {workspace.myRole === 'OWNER' && (
                      <div className="text-sm text-muted-foreground self-center">
                        Transfer ownership to leave
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Button variant="outline" onClick={() => navigate({ to: '/profile' })}>
              Back to profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
