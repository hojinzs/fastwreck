import { Link, useParams } from '@tanstack/react-router';
import { useWorkspace } from '@entities/workspace/api/workspace-queries';
import { useLogout } from '@entities/user/api/user-queries';
import { Button } from '@shared/ui/button';
import { Home, Settings, Users, LogOut, FileText } from 'lucide-react';

export function Sidebar() {
  const { workspaceId } = useParams({ from: '/workspace/$workspaceId' });
  const { data: workspace } = useWorkspace(workspaceId);
  const logout = useLogout();

  const navItems = [
    { to: `/workspace/${workspaceId}`, label: 'Dashboard', icon: Home },
    { to: `/workspace/${workspaceId}/drafts`, label: 'Drafts', icon: FileText },
    { to: `/workspace/${workspaceId}/members`, label: 'Members', icon: Users },
    { to: `/workspace/${workspaceId}/settings`, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Header */}
      <div className="border-b p-4">
        <Link to="/workspaces" className="block hover:opacity-80">
          <h2 className="text-lg font-semibold">{workspace?.name || 'Loading...'}</h2>
          <p className="text-sm text-muted-foreground">Fastwreck</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              activeProps={{
                className: 'bg-accent text-accent-foreground',
              }}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <Button variant="ghost" className="w-full justify-start" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
