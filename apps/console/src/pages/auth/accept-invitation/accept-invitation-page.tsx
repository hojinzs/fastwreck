import { useState, useEffect } from 'react';
import { useNavigate, useSearch, Link } from '@tanstack/react-router';
import { workspaceApi } from '@entities/workspace/api/workspace-api';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';

export function AcceptInvitationPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/invitations/accept' });
  const code = (search as any).code;

  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    if (!code) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    loadInvitation();
  }, [code]);

  const loadInvitation = async () => {
    try {
      const data = await workspaceApi.getInvitationByCode(code);

      // Check if user exists in the system
      if (!data.userExists) {
        // User not registered, redirect to signup with invite code
        navigate({ to: '/register', search: { inviteCode: code } });
        return;
      }

      // User exists, check if logged in
      const token = localStorage.getItem('accessToken');
      if (!token) {
        // Not logged in, redirect to login with redirectTo
        const redirectTo = `/invitations/accept?code=${code}`;
        navigate({ to: '/login', search: { redirectTo } });
        return;
      }

      // User is logged in, show invitation acceptance page
      setInvitation(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);

    try {
      await workspaceApi.acceptInvitation(code);
      // Clear the flags so user can see their new workspace
      sessionStorage.removeItem('invitationsChecked');
      localStorage.removeItem('workspaceCreationVisited');
      setAccepted(true);
      setTimeout(() => {
        navigate({ to: '/workspaces' });
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <div className="text-lg text-muted-foreground">초대 정보를 확인중입니다...</div>
        </div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/workspaces">
              <Button className="w-full">Go to workspaces</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation accepted!</CardTitle>
            <CardDescription>
              You've joined {invitation.workspace.name}. Redirecting...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Workspace Invitation</CardTitle>
          <CardDescription>
            You've been invited to join {invitation?.workspace.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Workspace</div>
            <div className="font-medium">{invitation?.workspace.name}</div>
            {invitation?.workspace.description && (
              <div className="text-sm text-muted-foreground">
                {invitation.workspace.description}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Your role</div>
            <div className="font-medium capitalize">{invitation?.role.toLowerCase()}</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Invited by</div>
            <div className="font-medium">{invitation?.invitedBy.name || 'Team member'}</div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Link to="/workspaces" className="flex-1">
              <Button variant="outline" className="w-full">
                Decline
              </Button>
            </Link>
            <Button className="flex-1" onClick={handleAccept} disabled={accepting}>
              {accepting ? 'Accepting...' : 'Accept invitation'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
