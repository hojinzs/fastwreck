import { ReactNode } from 'react';
import { QueryProvider } from './query-provider';
import { Toaster } from '@shared/ui/sonner';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      {children}
      <Toaster />
    </QueryProvider>
  );
}
