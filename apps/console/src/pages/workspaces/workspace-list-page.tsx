import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useWorkspaces } from '@entities/workspace/api/workspace-queries';
import { workspaceApi } from '@entities/workspace/api/workspace-api';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';

export function WorkspaceListPage() {
  const navigate = useNavigate();
  const { data: workspaces, isLoading, isError } = useWorkspaces();
  const [checkingInvitations, setCheckingInvitations] = useState(false);

  useEffect(() => {
    // If no workspaces, check for invitations first
    if (!isLoading && workspaces && workspaces.length === 0 && !checkingInvitations) {
      // Only check invitations once per session to avoid infinite loop
      const invitationsChecked = sessionStorage.getItem('invitationsChecked');
      if (!invitationsChecked) {
        checkInvitations();
      } else {
        // Already checked, go to create workspace
        navigate({ to: '/workspaces/new' });
      }
    }
  }, [workspaces, isLoading, navigate]);

  const checkInvitations = async () => {
    setCheckingInvitations(true);
    try {
      const invitations = await workspaceApi.getMyInvitations();
      const pendingInvitations = invitations.filter((inv: any) => inv.status === 'PENDING');

      // Mark that we checked invitations
      sessionStorage.setItem('invitationsChecked', 'true');

      if (pendingInvitations.length > 0) {
        // Has pending invitations, show them first
        navigate({ to: '/profile/invitations' });
      } else {
        // No invitations, redirect to create workspace page
        navigate({ to: '/workspaces/new' });
      }
    } catch (err) {
      console.error('Failed to check invitations:', err);
      // On error, just go to create workspace page
      sessionStorage.setItem('invitationsChecked', 'true');
      navigate({ to: '/workspaces/new' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading workspaces...</div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>Failed to load workspaces</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">Select a Workspace</h1>
          <p className="text-muted-foreground">Choose a workspace to continue</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workspaces?.map((workspace) => (
            <Card
              key={workspace.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate({ to: `/workspace/${workspace.id}` })}
            >
              <CardHeader>
                <CardTitle>{workspace.name}</CardTitle>
                {workspace.description && (
                  <CardDescription>{workspace.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Role: <span className="font-medium">{workspace.role}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card
            className="cursor-pointer border-dashed transition-shadow hover:shadow-md"
            onClick={() => navigate({ to: '/workspaces/new' })}
          >
            <CardContent className="flex h-full min-h-[150px] items-center justify-center">
              <div className="text-center">
                <div className="mb-2 text-2xl">+</div>
                <div className="font-medium">Create New Workspace</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
