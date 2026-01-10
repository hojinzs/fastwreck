# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Fastwreck** is an end-to-end automated content creation platform for content creators. The system manages the entire content production pipeline from Discovery to Publishing, focusing on preserving the creator's thought flow rather than replacing human creativity.

The Korean PRD (docs/PRD.md) describes this as "a workspace that connects the creator's thought flow without breaking it" - not an AI writing tool, but a system that prevents ideas from being lost.

### Core Philosophy
- Content creation is non-linear
- Automation reduces decision fatigue, not human judgment
- Each workspace area represents a cognitive stage, not just a feature
- Discovery → Ideas → Drafts → Publish represents how thoughts naturally flow

## Technology Stack

### Monorepo Structure
- **Build System**: Turborepo with pnpm workspaces
- **Package Manager**: pnpm 9.0.0
- **Node**: >= 18

### Frontend
- React 19.2 with Vite
- TanStack Router for routing
- TypeScript 5.9.2
- Tiptap for rich text editing (with custom ImageWithCaption extension)
- Storybook 8.6 for component development and testing

### Backend
- NestJS 11
- PostgreSQL with pgvector extension for vector embeddings
- Prisma 6 ORM
- REST API with Swagger/OpenAPI documentation
- Authentication: Passport (Local, JWT, OIDC)

### Infrastructure
- Docker Compose for local development
- PostgreSQL with pgvector extension
- Redis for caching and sessions
- Authentik (optional OIDC authentication provider)
- Planned: Miniflux (RSS reader integration)
- Planned: Pinchflat (YouTube downloader integration)
- Planned: n8n (optional workflow automation)

## Common Commands

### Development
```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, Authentik)
docker-compose -f docker-compose.infra.yaml up -d

# Run database migrations
cd apps/api && pnpm prisma:migrate

# Run all apps in dev mode
pnpm dev

# Run specific app only
turbo dev --filter=console  # Frontend SPA (port 3000)
turbo dev --filter=api      # Backend API (port 4000)

# Type checking
pnpm check-types
turbo check-types --filter=console
turbo check-types --filter=api

# Storybook (component development)
cd apps/console && pnpm storybook  # Start Storybook on port 6006
```

### Building
```bash
# Build all apps and packages
pnpm build

# Build specific app
turbo build --filter=console
turbo build --filter=api
```

### Linting & Formatting
```bash
# Lint all packages
pnpm lint

# Format code with Prettier
pnpm format

# Lint specific package
turbo lint --filter=console
turbo lint --filter=api
```

## Workspace Architecture

### Apps
- `apps/console` - Frontend SPA built with Vite + TanStack Router (port 3000)
  - File-based routing in `src/routes/`
  - TanStack Router automatically generates route tree
  - Auto-generated `src/routeTree.gen.ts` should be gitignored
- `apps/api` - Backend API built with NestJS (port 4000)
  - Main entry point: `src/main.ts`
  - Modular architecture with controllers, services, modules
  - CORS enabled for console app
  - Health check endpoint at `/health`

### Packages
- `@repo/ui` - Shared React component library
  - Uses barrel exports: `"./*": "./src/*.tsx"`
  - Can generate components with `turbo gen react-component`
- `@repo/eslint-config` - ESLint configurations
  - `base.js` - Base config
  - `next.js` - Next.js specific (legacy, may be removed)
  - `react-internal.js` - React library config
- `@repo/typescript-config` - Shared TypeScript configurations
  - `react-vite.json` - For Vite-based React apps (console)
  - `nest.json` - For NestJS backend (api)

### Turborepo Configuration
- Build tasks have dependency on upstream builds (`^build`)
- Dev task is persistent and not cached
- Build outputs cached in `dist/**` for both apps
- Inputs include `.env*` files

## Planned Architecture (Phase 1 MVP)

The system will be organized around these cognitive stages:

### 1. Workspace & Users
- Multi-workspace support with team collaboration
- Role-based permissions (owner, admin, member, viewer)
- JWT authentication

### 2. Discovery
- **RSS Integration** (Miniflux): Feed subscription with per-user read tracking
- **YouTube Integration** (Pinchflat): Channel subscription and auto-download
- Not a simple input - captures "what the creator is reacting to"

### 3. Ideas
- Discovery content becomes Ideas (selection, not generation)
- Vector embeddings stored in PostgreSQL with pgvector
- Similarity search for n8n agent retrieval
- Each idea links to source URLs and content

### 4. Drafts
- Tiptap rich text editor
- Version management with auto-save (3s debounce)
- JSON, HTML, and Markdown formats stored
- Not just a writing tool - "a record of decisions"

### 5. Channels
- Defines publishing endpoints
- Blog (title, RSS) and YouTube (URL)

### 6. Style Book
- Writing style guidelines
- Tone, forbidden expressions, formatting rules
- "A space for organizing standards for oneself"

### 7. Publish
- Publishing status management
- Analytics and performance tracking (Phase 2+)

### 8. Workflow & Automation
- Webhook API for n8n integration
- Event triggers: new discovery items, idea created/status changed, draft created/versioned
- Optional - automation is a choice, not a requirement

## Authentication & User Management

### Authentication Methods

The API supports two authentication methods:

1. **Local Authentication (Default)**
   - Email/password registration and login
   - Passwords hashed with bcrypt (10 rounds)
   - JWT tokens for session management (7 day expiry)
   - Set `AUTH_MODE=local` or leave unset

2. **OIDC Authentication (Authentik)**
   - Single Sign-On via Authentik
   - Set `AUTH_MODE=oidc` and configure OIDC environment variables
   - Automatically creates user accounts on first login
   - Users cannot have both local and OIDC authentication

### User Model

```prisma
model User {
  id         String       @id @default(uuid())
  email      String       @unique
  password   String?      // Nullable for OIDC users
  name       String?
  avatar     String?
  provider   AuthProvider @default(LOCAL)  // LOCAL or OIDC
  providerId String?      // OIDC subject identifier
  isActive   Boolean      @default(true)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
}
```

### Workspace Management

Multi-workspace support with role-based access control:

**Roles:**
- `OWNER`: Full control, cannot be removed or have role changed
- `ADMIN`: Can manage workspace settings and members
- `MEMBER`: Can access workspace resources
- `VIEWER`: Read-only access

**Workspace Model:**

```prisma
model Workspace {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  ownerId     String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkspaceMember {
  id          String        @id @default(uuid())
  role        WorkspaceRole @default(MEMBER)
  userId      String
  workspaceId String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@unique([userId, workspaceId])
}
```

### API Endpoints

- **Authentication**: `/auth/*` (register, login, OIDC flow, profile)
- **Users**: `/users/*` (CRUD operations, requires JWT)
- **Workspaces**: `/workspaces/*` (CRUD, member management, requires JWT)
- **API Docs**: `/api` (Swagger UI)
- **Health Check**: `/health`

See `apps/api/README.md` for detailed API documentation.

## Database Schema Notes

Implemented (Phase 0 - User & Workspace Management):
- User authentication and profile management
- Workspace and workspace member tables
- Role-based access control (OWNER, ADMIN, MEMBER, VIEWER)

When implementing Phase 1:
- Use UUIDs for all primary keys
- All tables should have `workspace_id` for multi-tenancy
- Vector embeddings are dimension 1536 (OpenAI ada-002)
- Use JSONB for flexible metadata storage
- Index vector columns: `CREATE INDEX ON idea_sources USING ivfflat (embedding vector_cosine_ops)`

## Key Technical Decisions

### Why pgvector
- Enables semantic search for idea sources
- Supports RAG-based draft generation (Phase 2)
- Native PostgreSQL extension, no separate vector DB needed

### Why n8n Integration
- Self-hosted workflow automation
- Users can customize their own pipelines
- Future business model: paid cloud workflows

### Why Docker Compose First
- Self-hosted first approach
- Goal: installable in < 5 minutes
- Cloud service comes later (Phase 3)

## Development Guidelines

### Adding New Features
- Reference the PRD (docs/PRD.md) for context on what each component means conceptually
- The CORE_CONCEPTS.md explains the "why" behind the product
- Follow the phase plan - MVP focuses on Discovery, Ideas, Drafts, and basic webhooks
- Don't over-engineer - the product values simplicity and user choice

### Working with Shared Packages
- UI components go in `packages/ui/src/`
- Import from apps using `@repo/ui/<component-name>`
- All packages are internal workspaces (not published)
- Run `turbo gen react-component` to scaffold new UI components

### TypeScript
- Strict mode enabled for frontend (console)
- Type check with `pnpm check-types` before committing
- TanStack Router auto-generates route types
- Backend uses more relaxed strictness for NestJS compatibility

### Testing Strategy (Phase 1 goals)
- E2E tests for critical workflows
- Success metrics:
  - Docker Compose install < 5 minutes
  - Handle 100 RSS feeds concurrently
  - 10 YouTube channels auto-download
  - Draft editor response < 100ms
  - n8n webhook success rate > 99%

## Project Status

**Phase 0 - User & Workspace Management** ✅ COMPLETED
- ✅ Frontend: Vite + TanStack Router SPA (console)
- ✅ Backend: NestJS API server (api)
- ✅ Database: PostgreSQL + pgvector with Prisma ORM
- ✅ Docker Compose: Infrastructure setup (PostgreSQL, Redis, Authentik)
- ✅ Authentication: Email/password and OIDC (Authentik) support
- ✅ User Management: CRUD operations with JWT authorization
- ✅ Workspace Management: Multi-workspace with role-based access control
- ✅ API Documentation: Swagger/OpenAPI at `/api`

**Next Steps - Phase 1**
- ⏳ Discovery (Miniflux + Pinchflat integrations)
- ⏳ Ideas & Drafts (vector search, Tiptap editor)
- ⏳ Webhooks and workflow automation examples

Phase 1 timeline (from PRD):
- Week 1-2: Docker Compose setup, NestJS/React initialization, PostgreSQL + pgvector
- Week 3-4: Discovery (Miniflux + Pinchflat integrations)
- Week 5-6: Ideas & Drafts (vector search, Tiptap editor)
- Week 7-8: Webhooks, workflow examples, E2E tests, documentation

## Quick Start

```bash
# 1. Install all dependencies
pnpm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env and set JWT_SECRET and other required variables

# 3. Start infrastructure (PostgreSQL, Redis, Authentik)
docker-compose -f docker-compose.infra.yaml up -d

# 4. Run database migrations
cd apps/api
pnpm prisma:migrate
pnpm prisma:generate
cd ../..

# 5. Run both console and api in dev mode
pnpm dev

# Or run them separately
turbo dev --filter=console
turbo dev --filter=api
```

Access points:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- API Documentation: http://localhost:4000/api
- API Health Check: http://localhost:4000/health
- Authentik (OIDC): http://localhost:9000