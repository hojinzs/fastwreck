import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { LoginPage } from '@pages/login/login-page';
import { RegisterPage } from '@pages/register/register-page';
import { OidcCallbackPage } from '@pages/auth/oidc-callback-page';
import { ForgotPasswordPage } from '@pages/auth/forgot-password/forgot-password-page';
import { ResetPasswordPage } from '@pages/auth/reset-password/reset-password-page';
import { AcceptInvitationPage } from '@pages/auth/accept-invitation/accept-invitation-page';
import { ProfilePage } from '@pages/profile/profile-page';
import { InvitationsPage } from '@pages/profile/invitations-page';
import { MyWorkspacesPage } from '@pages/profile/workspaces-page';
import { WorkspaceListPage } from '@pages/workspaces/workspace-list-page';
import { CreateWorkspacePage } from '@pages/workspaces/create-workspace-page';
import { DashboardPage } from '@pages/workspace/dashboard-page';
import { SettingsPage } from '@pages/workspace/settings-page';
import { MembersPage } from '@pages/workspace/members-page';
import { DraftsListPage } from '@pages/drafts/DraftsListPage';
import { DraftEditorPage } from '@pages/drafts/DraftEditorPage';
import { MainLayout } from '@widgets/layout/main-layout';

// Root route
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});

// Auth routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

const oidcCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/oidc/callback',
  component: OidcCallbackPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/forgot-password',
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/reset-password',
  component: ResetPasswordPage,
});

const acceptInvitationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/invitations/accept',
  component: AcceptInvitationPage,
});

// Profile routes
const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: ProfilePage,
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const myInvitationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/invitations',
  component: InvitationsPage,
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const myWorkspacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile/workspaces',
  component: MyWorkspacesPage,
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

// Workspace selection routes
const workspacesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces',
  component: WorkspaceListPage,
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const createWorkspaceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspaces/new',
  component: CreateWorkspacePage,
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

// Workspace routes with layout
const workspaceLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/workspace/$workspaceId',
  component: () => (
    <MainLayout>
      <Outlet />
    </MainLayout>
  ),
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
});

const workspaceDashboardRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/',
  component: DashboardPage,
});

const workspaceSettingsRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/settings',
  component: SettingsPage,
});

const workspaceMembersRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/members',
  component: MembersPage,
});

const workspaceDraftsRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/drafts',
  component: DraftsListPage,
});

const workspaceDraftNewRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/drafts/new',
  component: DraftEditorPage,
});

const workspaceDraftEditorRoute = createRoute({
  getParentRoute: () => workspaceLayoutRoute,
  path: '/drafts/$id',
  component: DraftEditorPage,
});

// Index route - redirect to workspaces
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
    throw redirect({ to: '/workspaces' });
  },
});

// Build route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  oidcCallbackRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  acceptInvitationRoute,
  profileRoute,
  myInvitationsRoute,
  myWorkspacesRoute,
  workspacesRoute,
  createWorkspaceRoute,
  workspaceLayoutRoute.addChildren([
    workspaceDashboardRoute,
    workspaceSettingsRoute,
    workspaceMembersRoute,
    workspaceDraftsRoute,
    workspaceDraftNewRoute,
    workspaceDraftEditorRoute,
  ]),
]);

// Create router
export const router = createRouter({ routeTree });

// Type declaration for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
