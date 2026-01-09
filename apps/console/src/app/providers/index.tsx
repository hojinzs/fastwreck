import { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { Toaster } from '@shared/ui/sonner';
import { ErrorBoundary } from '@shared/lib/error-boundary';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        {children}
        <Toaster />
      </QueryProvider>
    </ErrorBoundary>
  );
}
