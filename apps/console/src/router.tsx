import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  Link,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

const rootRoute = createRootRoute({
  component: () => (
    <>
      <div>
        <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
          <Link to="/" style={{ marginRight: '1rem' }}>
            Home
          </Link>
          <Link to="/about">About</Link>
        </nav>
      </div>
      <div style={{ padding: '1rem' }}>
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Index,
});

function Index() {
  return (
    <div>
      <h1>Fastwreck Console</h1>
      <p>Welcome to the content creation platform.</p>
    </div>
  );
}

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: 'about',
  component: About,
});

function About() {
  return (
    <div>
      <h1>About Fastwreck</h1>
      <p>A workspace that connects the creator's thought flow without breaking it.</p>
    </div>
  );
}

const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
