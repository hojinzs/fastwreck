# Fastwreck Setup Guide

Complete guide for setting up Fastwreck development environment.

## Prerequisites

- Node.js 18 or higher
- pnpm 9.0.0 (will be installed via corepack)
- Docker and Docker Compose
- Git

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fastwreck
```

### 2. Install Node Dependencies

```bash
# Enable corepack (if not already enabled)
corepack enable

# Install dependencies
pnpm install
```

### 3. Set Up Environment Variables

```bash
# Copy example environment file
cp .env.example .env
```

Edit `.env` and configure the following **required** variables:

```env
# Database
DATABASE_URL="postgresql://fastwreck:fastwreck_dev_password@localhost:5432/fastwreck?schema=public"

# JWT Secret (change this!)
JWT_SECRET=your-random-secret-key-at-least-32-characters-long

# Authentication mode (local or oidc)
AUTH_MODE=local
```

**Generate a secure JWT secret:**

```bash
# On macOS/Linux
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and Authentik
docker-compose -f docker-compose.infra.yaml up -d

# Check services are running
docker-compose -f docker-compose.infra.yaml ps

# View logs if needed
docker-compose -f docker-compose.infra.yaml logs -f
```

Services started:
- PostgreSQL with pgvector: `localhost:5432`
- Redis: `localhost:6379`
- Authentik (optional): `localhost:9000` (HTTP), `localhost:9443` (HTTPS)

### 5. Set Up Database

```bash
# Navigate to API directory
cd apps/api

# Run migrations
pnpm prisma:migrate

# Generate Prisma Client
pnpm prisma:generate

# Return to project root
cd ../..
```

### 6. Start Development Servers

```bash
# Start both frontend and backend
pnpm dev
```

Or run them separately:

```bash
# Terminal 1 - Backend API
turbo dev --filter=api

# Terminal 2 - Frontend Console
turbo dev --filter=console
```

### 7. Verify Installation

**API Health Check:**
```bash
curl http://localhost:4000/health
```

**API Documentation:**
Open http://localhost:4000/api in your browser to see Swagger UI.

**Frontend:**
Open http://localhost:3000 in your browser.

## Optional: Configure OIDC Authentication

If you want to use Authentik for OIDC authentication:

### 1. Access Authentik

1. Open http://localhost:9000 in your browser
2. Initial setup wizard will appear
3. Create admin account

### 2. Create Application in Authentik

1. Go to **Applications** → **Create**
2. Set name: `Fastwreck`
3. Set slug: `fastwreck`
4. Choose provider type: **OAuth2/OpenID Provider**

### 3. Configure Provider

1. Set authorization flow: Choose or create a default flow
2. Set redirect URIs:
   ```
   http://localhost:4000/auth/oidc/callback
   http://localhost:3000/auth/callback
   ```
3. Set Client type: **Confidential**
4. Save and note the **Client ID** and **Client Secret**

### 4. Update Environment Variables

Edit `.env`:

```env
AUTH_MODE=oidc
OIDC_ISSUER=http://localhost:9000/application/o/fastwreck/
OIDC_CLIENT_ID=<your-client-id>
OIDC_CLIENT_SECRET=<your-client-secret>
OIDC_REDIRECT_URI=http://localhost:4000/auth/oidc/callback
```

### 5. Restart API Server

```bash
# Stop the API server (Ctrl+C) and restart
turbo dev --filter=api
```

### 6. Test OIDC Login

Navigate to:
```
http://localhost:4000/auth/oidc
```

You should be redirected to Authentik login page.

## Development Workflow

### Database Management

```bash
cd apps/api

# Create a new migration
pnpm prisma:migrate

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset

# Open Prisma Studio (database GUI)
pnpm prisma:studio
```

### Type Checking

```bash
# Check all packages
pnpm check-types

# Check specific package
turbo check-types --filter=api
turbo check-types --filter=console
```

### Linting

```bash
# Lint all packages
pnpm lint

# Lint specific package
turbo lint --filter=api
turbo lint --filter=console
```

### Building

```bash
# Build all apps
pnpm build

# Build specific app
turbo build --filter=api
turbo build --filter=console
```

## Testing the API

### Using cURL

**Register a new user:**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get user profile (requires JWT token):**
```bash
TOKEN="<your-jwt-token-from-login>"

curl http://localhost:4000/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Create a workspace:**
```bash
curl -X POST http://localhost:4000/workspaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "My Workspace",
    "slug": "my-workspace",
    "description": "Test workspace"
  }'
```

### Using Swagger UI

1. Open http://localhost:4000/api
2. Click **Authorize** button
3. Enter your JWT token from login
4. Try out the endpoints

## Troubleshooting

### Port Already in Use

If ports 3000, 4000, 5432, 6379, or 9000 are already in use:

1. Stop conflicting services, or
2. Change ports in `docker-compose.infra.yaml` and `.env`

### Database Connection Error

```bash
# Check PostgreSQL is running
docker-compose -f docker-compose.infra.yaml ps

# Check PostgreSQL logs
docker-compose -f docker-compose.infra.yaml logs postgres

# Restart PostgreSQL
docker-compose -f docker-compose.infra.yaml restart postgres
```

### Prisma Client Out of Sync

If you see "Prisma Client is out of sync" error:

```bash
cd apps/api
pnpm prisma:generate
```

### Reset Everything

To completely reset the development environment:

```bash
# Stop and remove containers
docker-compose -f docker-compose.infra.yaml down -v

# Remove node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# Restart from step 4
```

### Authentik Not Starting

Check logs:
```bash
docker-compose -f docker-compose.infra.yaml logs authentik-server
docker-compose -f docker-compose.infra.yaml logs authentik-worker
```

Ensure `AUTHENTIK_SECRET_KEY` in `.env` is at least 50 characters long.

## Next Steps

- Read `apps/api/README.md` for API documentation
- Read `docs/PRD.md` for product requirements
- Read `docs/CORE_CONCEPTS.md` for product philosophy
- Check `CLAUDE.md` for development guidelines

## Stopping Services

```bash
# Stop all services
docker-compose -f docker-compose.infra.yaml down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose -f docker-compose.infra.yaml down -v
```

## Production Deployment

For production deployment:

1. Change all default passwords in `.env`
2. Use strong, randomly generated secrets
3. Set `NODE_ENV=production`
4. Use a proper reverse proxy (nginx, Caddy)
5. Enable HTTPS
6. Set up proper backup strategy for PostgreSQL
7. Configure email settings for Authentik (if using OIDC)

See production deployment guide (coming soon) for detailed instructions.
