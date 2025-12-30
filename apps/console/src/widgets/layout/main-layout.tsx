import { ReactNode } from 'react';
import { Sidebar } from '../sidebar/sidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1680px] p-6">{children}</div>
      </main>
    </div>
  );
}
