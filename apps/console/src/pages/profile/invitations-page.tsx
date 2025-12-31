import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { workspaceApi } from '@entities/workspace/api/workspace-api';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';

export function InvitationsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const data = await workspaceApi.getMyInvitations();
      setInvitations(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (code: string) => {
    try {
      await workspaceApi.acceptInvitation(code);
      // Clear the flags so user can see their new workspace
      sessionStorage.removeItem('invitationsChecked');
      localStorage.removeItem('workspaceCreationVisited');
      navigate({ to: '/workspaces' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
    }
  };

  useEffect(() => {
    // If no pending invitations, redirect to workspaces/new
    if (!loading && invitations.length > 0) {
      const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING');
      if (pendingInvitations.length === 0) {
        navigate({ to: '/workspaces/new' });
      }
    }
  }, [loading, invitations, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">Loading invitations...</div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'PENDING');

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Workspace Invitations</CardTitle>
          <CardDescription>
            Invitations you have received from other workspaces
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {pendingInvitations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No pending invitations
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-lg">
                      {invitation.workspace.name}
                    </div>
                    {invitation.workspace.description && (
                      <div className="text-sm text-muted-foreground">
                        {invitation.workspace.description}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Role</div>
                      <div className="font-medium capitalize">
                        {invitation.role.toLowerCase()}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Invited by</div>
                      <div className="font-medium">
                        {invitation.invitedBy.name || invitation.invitedBy.email}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate({ to: '/workspaces' })}
                    >
                      Ignore
                    </Button>
                    <Button onClick={() => handleAccept(invitation.code)}>
                      Accept invitation
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6">
            <Button variant="outline" onClick={() => navigate({ to: '/workspaces' })}>
              Back to workspaces
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
