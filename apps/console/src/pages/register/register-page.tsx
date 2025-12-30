import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useRegister } from '@entities/user/api/user-queries';
import { registerSchema, type RegisterFormData } from '@entities/user/model/user.types';
import { workspaceApi } from '@entities/workspace/api/workspace-api';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';

export function RegisterPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/register' });
  const inviteCode = (search as any)?.inviteCode;
  const registerMutation = useRegister();

  const [invitation, setInvitation] = useState<any>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (inviteCode) {
      loadInvitation();
    }
  }, [inviteCode]);

  const loadInvitation = async () => {
    setLoadingInvitation(true);
    try {
      const data = await workspaceApi.getInvitationByCode(inviteCode);
      setInvitation(data);
      // Pre-fill email from invitation
      setValue('email', data.email);
    } catch (err) {
      console.error('Failed to load invitation:', err);
    } finally {
      setLoadingInvitation(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        name: data.name,
      });

      // If there's an invitation code, accept it after registration
      if (inviteCode) {
        try {
          await workspaceApi.acceptInvitation(inviteCode);
          // Clear the invitations checked flag so user can see their new workspace
          sessionStorage.removeItem('invitationsChecked');
        } catch (err) {
          console.error('Failed to accept invitation:', err);
        }
      }

      navigate({ to: '/workspaces' });
    } catch (error: any) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
          <CardDescription>
            {loadingInvitation
              ? 'Loading invitation...'
              : invitation
              ? `Join ${invitation.workspace.name} as ${invitation.role.toLowerCase()}`
              : 'Sign up for a new Fastwreck account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitation && (
            <div className="mb-4 rounded-md border p-3 space-y-1">
              <div className="text-sm font-medium">Workspace Invitation</div>
              <div className="text-sm text-muted-foreground">
                You've been invited to join <strong>{invitation.workspace.name}</strong>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
                disabled={!!invitation}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input id="name" type="text" placeholder="Your Name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {registerMutation.isError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {(registerMutation.error as any)?.response?.data?.message ||
                  'Registration failed. Please try again.'}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
