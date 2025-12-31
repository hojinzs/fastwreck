import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useLogin } from '@entities/user/api/user-queries';
import { loginSchema, type LoginFormData } from '@entities/user/model/user.types';
import { workspaceApi } from '@entities/workspace/api/workspace-api';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Label } from '@shared/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';
import { env } from '@shared/config/env';

export function LoginPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });
  const inviteCode = (search as any)?.inviteCode;
  const redirectTo = (search as any)?.redirectTo;
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await loginMutation.mutateAsync(data);

      // If there's an invitation code, accept it after login
      if (inviteCode) {
        try {
          await workspaceApi.acceptInvitation(inviteCode);
          // Clear the invitations checked flag so user can see their new workspace
          sessionStorage.removeItem('invitationsChecked');
        } catch (err) {
          console.error('Failed to accept invitation:', err);
        }
      }

      // Check if there's a redirectTo parameter
      if (redirectTo) {
        window.location.href = redirectTo;
      } else {
        navigate({ to: '/workspaces' });
      }
    } catch (error: any) {
      console.error('Login failed:', error);
    }
  };

  const handleOidcLogin = () => {
    window.location.href = env.oidcAuthorizeUrl;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>Sign in to your Fastwreck account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/auth/forgot-password"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {loginMutation.isError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {(loginMutation.error as any)?.response?.data?.message ||
                  'Login failed. Please check your credentials.'}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
            </Button>

            {env.oidcEnabled && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleOidcLogin}
                >
                  Sign in with SSO
                </Button>
              </>
            )}
          </form>

          <div className="mt-4 text-center text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
