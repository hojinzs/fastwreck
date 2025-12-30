import { useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useOidcCallback } from '@entities/user/api/user-queries';

export function OidcCallbackPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/auth/oidc/callback' });
  const oidcCallbackMutation = useOidcCallback();

  useEffect(() => {
    const code = (search as any).code;

    if (code) {
      oidcCallbackMutation.mutate(code, {
        onSuccess: () => {
          navigate({ to: '/workspaces' });
        },
        onError: (error) => {
          console.error('OIDC callback failed:', error);
          navigate({ to: '/login' });
        },
      });
    } else {
      navigate({ to: '/login' });
    }
  }, [search]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-lg font-medium">Completing sign in...</div>
        <div className="text-sm text-muted-foreground">Please wait a moment</div>
      </div>
    </div>
  );
}
