import { ReactNode } from 'react';
import { cn } from '@shared/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  variant?: 'default' | 'withSidePanel';
  className?: string;
}

interface PageLayoutMainProps {
  children: ReactNode;
  className?: string;
}

interface PageLayoutSidePanelProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, variant = 'default', className }: PageLayoutProps) {
  if (variant === 'withSidePanel') {
    return (
      <div className={cn('flex gap-6', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('mx-auto max-w-[1660px]', className)}>
      {children}
    </div>
  );
}

PageLayout.Main = function PageLayoutMain({ children, className }: PageLayoutMainProps) {
  return (
    <div className={cn('flex-1 max-w-[1660px]', className)}>
      {children}
    </div>
  );
};

PageLayout.SidePanel = function PageLayoutSidePanel({ children, className }: PageLayoutSidePanelProps) {
  return (
    <aside className={cn('w-80 flex-shrink-0', className)}>
      {children}
    </aside>
  );
};
