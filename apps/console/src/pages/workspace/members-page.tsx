import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from '@tanstack/react-router';
import {
  useWorkspaceMembers,
  useInviteMember,
  useUpdateMemberRole,
  useRemoveMember,
} from '@entities/workspace/api/workspace-queries';
import {
  inviteMemberSchema,
  type InviteMemberFormData,
  WorkspaceRole,
} from '@entities/workspace/model/workspace.types';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { UserPlus, Trash2 } from 'lucide-react';

export function MembersPage() {
  const { workspaceId } = useParams({ from: '/workspace/$workspaceId/members' });
  const { data: members, isLoading } = useWorkspaceMembers(workspaceId);
  const inviteMemberMutation = useInviteMember();
  const updateMemberRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveMember();
  const [showInviteForm, setShowInviteForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      role: WorkspaceRole.MEMBER,
    },
  });

  const onInvite = async (data: InviteMemberFormData) => {
    try {
      await inviteMemberMutation.mutateAsync({
        workspaceId,
        data,
      });
      reset();
      setShowInviteForm(false);
      alert('Member invited successfully!');
    } catch (error: any) {
      console.error('Failed to invite member:', error);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    try {
      await updateMemberRoleMutation.mutateAsync({
        workspaceId,
        memberId,
        data: { role: newRole },
      });
      alert('Member role updated successfully!');
    } catch (error: any) {
      console.error('Failed to update member role:', error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await removeMemberMutation.mutateAsync({
        workspaceId,
        memberId,
      });
      alert('Member removed successfully!');
    } catch (error: any) {
      console.error('Failed to remove member:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground">Manage workspace members</p>
        </div>
        <Button onClick={() => setShowInviteForm(!showInviteForm)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>

      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>Send an invitation to join this workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="member@example.com" {...register('email')} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  {...register('role')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value={WorkspaceRole.VIEWER}>Viewer</option>
                  <option value={WorkspaceRole.MEMBER}>Member</option>
                  <option value={WorkspaceRole.ADMIN}>Admin</option>
                </select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>

              {inviteMemberMutation.isError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {(inviteMemberMutation.error as any)?.response?.data?.message ||
                    'Failed to invite member. Please try again.'}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowInviteForm(false);
                    reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMemberMutation.isPending}>
                  {inviteMemberMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Current Members</CardTitle>
          <CardDescription>
            {members?.length || 0} member{members?.length !== 1 ? 's' : ''} in this workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {member.user?.name?.[0]?.toUpperCase() || member.user?.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">
                      {member.user?.name || member.user?.email}
                    </div>
                    {member.user?.name && (
                      <div className="text-sm text-muted-foreground">{member.user.email}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.role !== WorkspaceRole.OWNER && (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as WorkspaceRole)}
                      className="rounded-md border border-input bg-background px-3 py-1 text-sm"
                      disabled={updateMemberRoleMutation.isPending}
                    >
                      <option value={WorkspaceRole.VIEWER}>Viewer</option>
                      <option value={WorkspaceRole.MEMBER}>Member</option>
                      <option value={WorkspaceRole.ADMIN}>Admin</option>
                    </select>
                  )}
                  {member.role === WorkspaceRole.OWNER && (
                    <span className="rounded-md bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                      Owner
                    </span>
                  )}

                  {member.role !== WorkspaceRole.OWNER && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={removeMemberMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {members?.length === 0 && (
              <div className="text-center text-muted-foreground">No members yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
