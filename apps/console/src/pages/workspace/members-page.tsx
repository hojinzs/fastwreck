import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  useWorkspaceMembers,
  useWorkspaceInvitations,
  useCreateInvitation,
  useCancelInvitation,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/ui/select';
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
import { UserPlus, Trash2, Copy, Check } from 'lucide-react';

export function MembersPage() {
  const { workspaceId } = useParams({ from: '/workspace/$workspaceId/members' });
  const { data: members, isLoading } = useWorkspaceMembers(workspaceId);
  const { data: invitations, isLoading: invitationsLoading } = useWorkspaceInvitations(workspaceId);
  const createInvitationMutation = useCreateInvitation();
  const cancelInvitationMutation = useCancelInvitation();
  const updateMemberRoleMutation = useUpdateMemberRole();
  const removeMemberMutation = useRemoveMember();

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'member' | 'invitation'; id: string | null }>({
    open: false,
    type: 'member',
    id: null,
  });

  const form = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      role: WorkspaceRole.MEMBER,
    },
  });

  const onInvite = async (data: InviteMemberFormData) => {
    try {
      const result = await createInvitationMutation.mutateAsync({
        workspaceId,
        data,
      });
      form.reset();
      setShowInviteForm(false);

      if (result.mailSent) {
        toast.success('Invitation email sent successfully!');
      } else {
        toast.info('Invitation created. Copy the invitation link from the list.');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to invite member');
    }
  };

  const handleCopyInviteLink = async (code: string) => {
    const link = `${window.location.origin}/invitations/accept?code=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedCode(code);
      toast.success('Invitation link copied to clipboard');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleCancelInvitation = (invitationId: string) => {
    setDeleteDialog({ open: true, type: 'invitation', id: invitationId });
  };

  const handleRemoveMember = (memberId: string) => {
    setDeleteDialog({ open: true, type: 'member', id: memberId });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      if (deleteDialog.type === 'invitation') {
        await cancelInvitationMutation.mutateAsync({
          workspaceId,
          invitationId: deleteDialog.id,
        });
        toast.success('Invitation cancelled successfully');
      } else {
        await removeMemberMutation.mutateAsync({
          workspaceId,
          memberId: deleteDialog.id,
        });
        toast.success('Member removed successfully');
      }
      setDeleteDialog({ open: false, type: 'member', id: null });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Operation failed');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: WorkspaceRole) => {
    try {
      await updateMemberRoleMutation.mutateAsync({
        workspaceId,
        memberId,
        data: { role: newRole },
      });
      toast.success('Member role updated successfully');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update role');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Members" description="Manage workspace members" />
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Members"
        description="Manage workspace members"
        action={
          <Button onClick={() => setShowInviteForm(!showInviteForm)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        }
      />

      {showInviteForm && (
        <Card>
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>Send an invitation to join this workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onInvite)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="member@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={WorkspaceRole.VIEWER}>Viewer</SelectItem>
                          <SelectItem value={WorkspaceRole.MEMBER}>Member</SelectItem>
                          <SelectItem value={WorkspaceRole.ADMIN}>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {createInvitationMutation.isError && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {(createInvitationMutation.error as any)?.response?.data?.message ||
                      'Failed to invite member. Please try again.'}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowInviteForm(false);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createInvitationMutation.isPending}>
                    {createInvitationMutation.isPending ? 'Inviting...' : 'Send Invitation'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {!invitationsLoading && invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation: any) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{invitation.email}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="capitalize">{invitation.role.toLowerCase()}</span>
                      <span>•</span>
                      <span>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyInviteLink(invitation.code)}
                    >
                      {copiedCode === invitation.code ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy link
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvitation(invitation.id)}
                      disabled={cancelInvitationMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
                  {member.role !== WorkspaceRole.OWNER ? (
                    <Select
                      value={member.role}
                      onValueChange={(value) => handleRoleChange(member.id, value as WorkspaceRole)}
                      disabled={updateMemberRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={WorkspaceRole.VIEWER}>Viewer</SelectItem>
                        <SelectItem value={WorkspaceRole.MEMBER}>Member</SelectItem>
                        <SelectItem value={WorkspaceRole.ADMIN}>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
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

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog(
            open
              ? { ...deleteDialog, open }
              : { open: false, type: 'member', id: null }
          )
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.type === 'invitation'
                ? 'This will cancel the invitation. The recipient will no longer be able to use this invitation link.'
                : 'This will remove the member from the workspace. They will lose access to all workspace resources.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDialog.type === 'invitation' ? 'Cancel Invitation' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
