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
    // Check if user is logged in
    const token = localStorage.getItem('accessToken');
    if (!token) {
      // Redirect to login with invitation code
      navigate({ to: '/login', search: { inviteCode: code } });
      return;
    }

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
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading invitation...</div>
          </CardContent>
        </Card>
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
