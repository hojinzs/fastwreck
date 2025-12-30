# Frontend Technical Guide

This document outlines the coding conventions, architecture, and best practices for the frontend application (`apps/console-app`).

## 1. Architecture: Feature-Sliced Design (FSD)

We follow [Feature-Sliced Design](https://feature-sliced.design/) to organize our codebase.

### Layers (Ordered by dependencies)

1. **Shared**: Resuable infrastructure code (UI Kit, API client, utils). **Cannot import from upper layers.**
2. **Entities**: Business domain models (e.g., Subject, User). Contains data fetching logic and types.
3. **Features**: User interactions (e.g., ManageSubjects, AuthForm). Handles UI logic interacting with entities.
4. **Widgets**: Compositional units (e.g., Sidebar, Header, PageLayout).
5. **Pages**: Routing components. Composes widgets and features.
6. **App**: Global configuration (Providers, Router default, Styles).

### Path Aliases

Always use the configured path aliases in `tsconfig.json`:

- `@app/*`
- `@pages/*`
- `@widgets/*`
- `@features/*`
- `@entities/*`
- `@shared/*`

## 2. API Integration

### Axios & Authentication

- All API requests MUST use the configured client: `@shared/api/api-client`.
- **Do not** use `axios` directly or `fetch`.
- The `apiClient` automatically injects the OIDC Access Token (`Authorization: Bearer ...`) into every request.
- If `VITE_API_BASE_URL` is configured, it will be used as the base URL.

### Data Fetching (TanStack Query)

- All server state management relies on **TanStack Query**.
- **Location**: Define hooks in `src/entities/<Entity>/api/queries.ts`.
- **Naming**: Use `use<Entity>s` (list), `use<Entity>` (detail), `useCreate<Entity>`, etc.
- **Query Keys**: Use a key factory object to ensure consistency (e.g., `subjectKeys.all`, `subjectKeys.lists()`, `subjectKeys.detail(id)`).

```typescript
// Example: src/entities/subject/api/queries.ts
export const subjectKeys = {
  all: ["subjects"] as const,
  lists: () => [...subjectKeys.all, "list"] as const,
  detail: (id: string) => [...subjectKeys.all, "detail", id] as const,
};

export function useSubjects() {
  return useQuery({
    queryKey: subjectKeys.lists(),
    queryFn: subjectApi.getSubjects,
  });
}
```

## 3. Component & UI

### Shadcn UI

- Reusable UI components are located in `@shared/ui`.
- Do not modify them directly unless necessary for global styling changes.

### Styling

- Use **Tailwind CSS** for styling.
- Avoid CSS Modules or vanilla CSS unless for global resets (`src/app/styles/styles.css`).

## 4. Routing

### TanStack Router

- Routes are defined in `@app/router.tsx`.
- Use file-based routing convention where logical, but currently defined explicitly in the router file for type safety.
- **Type Safety**: Use `Link` component with strict type checking for `to` and `params`.

## 5. Forms

- Use **React Hook Form** for form state management.
- Use **Zod** for schema validation.
- Define Zod schemas in `src/entities/<Entity>/model/types.ts` to share between API and Forms.
