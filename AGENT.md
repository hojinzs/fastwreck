# AGENT.md

This file provides guidance for AI agents working on the Fastwreck codebase. It complements the existing CLAUDE.md file with agent-specific instructions and patterns.

## Project Overview

**Fastwreck** is an end-to-end automated content creation platform built as a monorepo with Turborepo. The system manages the entire content production pipeline from Discovery to Publishing, focusing on preserving the creator's thought flow rather than replacing human creativity.

### Core Philosophy

- Content creation is non-linear
- Automation reduces decision fatigue, not human judgment
- Each workspace area represents a cognitive stage, not just a feature
- Discovery → Ideas → Drafts → Publish represents how thoughts naturally flow

## Architecture Summary

### Monorepo Structure

- **Build System**: Turborepo with pnpm workspaces
- **Package Manager**: pnpm 9.0.0
- **Node**: >= 18

### Applications

- `apps/console` - Frontend SPA (React 19.2 + Vite, port 3000)
- `apps/api` - Backend API (NestJS 11, port 4000)

### Shared Packages

- `@repo/ui` - Shared React component library
- `@repo/eslint-config` - ESLint configurations
- `@repo/typescript-config` - TypeScript configurations

### Infrastructure

- PostgreSQL with pgvector extension
- Redis for caching and sessions
- Docker Compose for local development
- Optional Authentik for OIDC authentication

## Agent Development Guidelines

### Code Analysis Before Implementation

Before making any changes, always:

1. **Understand the existing patterns**:
   - Use `grep` and `ast-grep-search` to find similar implementations
   - Check existing controllers, services, and DTOs for patterns
   - Look at the database schema for relationships

2. **Follow established conventions**:
   - Backend: NestJS modules with controllers, services, DTOs
   - Frontend: Feature-based organization with pages, widgets, features
   - Database: Prisma schema with UUIDs, proper indexing

3. **Check dependencies**:
   - Verify required packages are installed
   - Use existing libraries before adding new ones
   - Check workspace configurations

### Backend Development Patterns

#### NestJS Module Structure

```
src/
├── feature-name/
│   ├── dto/              # Data transfer objects
│   ├── feature.controller.ts
│   ├── feature.service.ts
│   └── feature.module.ts
```

#### Controller Patterns

- Use `@Controller()` with appropriate base path
- Inject services via constructor
- Use `@UseGuards(JwtAuthGuard)` for protected endpoints
- Return consistent response formats
- Handle errors appropriately

#### Service Patterns

- Inject PrismaService for database operations
- Use transactions for multi-table operations
- Implement proper error handling
- Follow repository pattern for complex queries

#### DTO Patterns

- Use `class-validator` decorators for validation
- Use `@ApiProperty()` for Swagger documentation
- Create separate DTOs for create, update, and query operations
- Use `PartialType` for update DTOs

#### Database Patterns

- All tables use UUID primary keys
- Multi-tenancy via `workspace_id` columns
- Proper foreign key relationships with `onDelete: Cascade`
- Indexes for frequently queried columns
- Use `@@map()` for snake_case table names

### Frontend Development Patterns

#### Component Organization

```
src/
├── pages/           # Route-level components
├── widgets/         # Reusable feature components
├── features/        # Feature-specific components
├── entities/        # Domain entities
├── shared/          # Shared utilities and UI
└── app/            # App setup and providers
```

#### React Patterns

- Use functional components with hooks
- Implement proper error boundaries
- Use React Query for server state management
- Follow the established prop interface patterns

#### Routing Patterns

- TanStack Router with file-based routing
- Auto-generated route types (gitignored)
- Proper route protection with loaders
- Consistent route naming conventions

#### State Management

- React Query for server state
- Local state with useState/useReducer
- Form state with react-hook-form
- Global state via context providers when needed

### Database Schema Guidelines

#### Table Design

- Use UUID primary keys: `id String @id @default(uuid())`
- Add workspace context: `workspaceId String`
- Include audit fields: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- Use proper relationships with cascade deletes
- Add indexes for performance

#### Naming Conventions

- Tables: snake_case with `@@map()` decorator
- Columns: camelCase in Prisma, snake_case in database
- Enums: PascalCase with descriptive names
- Relations: Descriptive names following the pattern

#### Example Table

```prisma
model Example {
  id          String   @id @default(uuid())
  name        String
  description String?
  workspaceId String
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  createdById String
  createdBy   User   @relation(fields: [createdById], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([workspaceId])
  @@index([createdById])
  @@map("examples")
}
```

### API Development Guidelines

#### Endpoint Design

- RESTful conventions with proper HTTP methods
- Consistent response formats
- Proper error handling with status codes
- JWT authentication for protected endpoints
- Role-based access control when applicable

#### Response Format

```typescript
// Success response
{
  "data": T,
  "message": string
}

// Error response
{
  "statusCode": number,
  "message": string,
  "error": string
}
```

#### Authentication Patterns

- Use `@CurrentUser()` decorator for user context
- Implement role-based checks in services
- Use guards for endpoint protection
- Handle both local and OIDC authentication

### Testing Guidelines

#### Backend Testing

- Unit tests for services
- Integration tests for controllers
- Database tests with test fixtures
- API endpoint testing

#### Frontend Testing

- Component testing with Storybook
- Integration testing for critical flows
- E2E testing for user workflows
- Visual regression testing

### Common Commands

#### Development

```bash
# Install dependencies
pnpm install

# Start infrastructure
docker-compose -f docker-compose.infra.yaml up -d

# Run database migrations
cd apps/api && pnpm prisma:migrate

# Run all apps
pnpm dev

# Run specific app
turbo dev --filter=console
turbo dev --filter=api
```

#### Building & Quality

```bash
# Build all apps
pnpm build

# Type checking
pnpm check-types

# Linting
pnpm lint

# Formatting
pnpm format
```

#### Database Operations

```bash
# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Open Prisma Studio
pnpm prisma:studio

# Seed database
pnpm prisma:seed
```

### Environment Configuration

#### Required Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `REDIS_URL` - Redis connection string

#### Optional Variables

- `AUTH_MODE` - 'local' or 'oidc'
- `OIDC_ISSUER` - OIDC provider URL
- `MAIL_DRIVER` - Email service provider
- `MEDIA_STORAGE_TYPE` - 'local' or 's3'

### Security Guidelines

#### Authentication

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with configurable expiry
- Proper session management
- OIDC integration support

#### Authorization

- Role-based access control (OWNER, ADMIN, MEMBER, VIEWER)
- Workspace-level permissions
- Resource ownership checks
- API endpoint protection

#### Data Protection

- Input validation with class-validator
- SQL injection prevention via Prisma
- XSS protection in frontend
- CORS configuration

### Performance Guidelines

#### Database

- Proper indexing for queries
- Connection pooling via Prisma
- Vector search optimization with pgvector
- Query optimization for large datasets

#### Frontend

- Code splitting with TanStack Router
- Image optimization and lazy loading
- React Query caching strategies
- Bundle size optimization

#### API

- Response caching where appropriate
- Pagination for large datasets
- Efficient database queries
- Proper error handling

### Integration Patterns

#### External Services

- Miniflux for RSS integration (planned)
- Pinchflat for YouTube integration (planned)
- n8n for workflow automation (planned)
- Email service providers (SendGrid, Mailgun, SMTP)

#### Webhook System

- Event-driven architecture
- Proper webhook signature validation
- Retry mechanisms for failed deliveries
- Comprehensive logging

## Agent-Specific Instructions

### When Adding New Features

1. **Phase Planning**: Check which phase the feature belongs to (Phase 0, 1, 2+)
2. **Database First**: Design the schema before implementing the API
3. **API Then UI**: Implement backend endpoints before frontend components
4. **Test Coverage**: Add tests for critical functionality
5. **Documentation**: Update relevant documentation files

### When Modifying Existing Code

1. **Understand Context**: Read related files to understand the full context
2. **Maintain Patterns**: Follow existing code patterns and conventions
3. **Backward Compatibility**: Consider impact on existing functionality
4. **Test Thoroughly**: Ensure changes don't break existing features
5. **Update Documentation**: Keep documentation in sync

### When Debugging Issues

1. **Check Logs**: Review application logs for error details
2. **Database State**: Verify database state with Prisma Studio
3. **API Testing**: Test endpoints directly before checking frontend
4. **Network Issues**: Check CORS and authentication configuration
5. **Environment**: Verify environment variables are set correctly

### Code Quality Standards

- **TypeScript**: Strict mode enabled, proper type definitions
- **ESLint**: Zero warnings threshold, consistent formatting
- **Prettier**: Consistent code formatting across the project
- **Comments**: Minimal comments, self-documenting code preferred
- **Naming**: Descriptive names following established conventions

## Project Status

### Completed (Phase 0)

- ✅ User authentication and management
- ✅ Workspace management with role-based access control
- ✅ Media upload and management system
- ✅ Draft creation and version management
- ✅ Basic API documentation

### In Progress (Phase 1)

- ⏳ RSS integration (Miniflux)
- ⏳ YouTube integration (Pinchflat)
- ⏳ Ideas management with vector search
- ⏳ Enhanced draft editor with Tiptap
- ⏳ Webhook system for n8n integration

### Future (Phase 2+)

- 📋 Publishing automation
- 📋 Analytics and performance tracking
- 📋 Social media integration
- 📋 Advanced workflow automation

## Quick Reference

### File Locations

- API Schema: `apps/api/prisma/schema.prisma`
- API Main: `apps/api/src/main.ts`
- Console Main: `apps/console/src/main.tsx`
- Router Config: `apps/console/src/router.tsx`
- Docker Config: `docker-compose.infra.yaml`
- Environment: `.env.example`

### Port Configuration

- Frontend (Console): 3000
- Backend (API): 4000
- PostgreSQL: 5432
- Redis: 6379
- Storybook: 6006
- Authentik (optional): 9000/9443

### Key Dependencies

- **Backend**: NestJS, Prisma, Passport, JWT, bcrypt
- **Frontend**: React, TanStack Router, Tiptap, Tailwind CSS
- **Database**: PostgreSQL, pgvector, Redis
- **Development**: Vite, Storybook, ESLint, Prettier

This AGENT.md file should be kept in sync with the project's evolution and updated as new patterns and conventions are established.
