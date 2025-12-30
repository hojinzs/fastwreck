# Dev Container Configuration

This directory contains the Dev Container configuration for Fastwreck development environment.

## What's Included

### Features
- **Node.js 20**: JavaScript/TypeScript runtime
- **pnpm 9.0.0**: Fast, disk space efficient package manager
- **Docker-in-Docker**: Enables running Docker commands inside the container

### VSCode Extensions
- **Prisma**: Syntax highlighting and formatting for Prisma schema files
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Enhanced TypeScript support
- **EditorConfig**: Consistent coding styles

### Infrastructure Services
The Dev Container automatically starts the following services via Docker Compose:
- **PostgreSQL** (port 5432): Main database with pgvector extension
- **Redis** (port 6379): Cache and session storage

### Port Forwarding
- `3000`: Frontend (Console) - React + Vite
- `4000`: Backend (API) - NestJS
- `5432`: PostgreSQL database
- `6379`: Redis cache

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) or [Docker Engine](https://docs.docker.com/engine/install/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Opening in Dev Container

1. Open this repository in Visual Studio Code
2. Press `F1` or `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)
3. Select **"Dev Containers: Reopen in Container"**
4. Wait for the container to build and start (first time may take a few minutes)

The Dev Container will automatically:
- Install Node.js 20 and pnpm 9.0.0
- Start PostgreSQL and Redis containers
- Wait for services to be healthy
- Copy `.env.example` to `.env` if it doesn't exist

### After Opening

Once the Dev Container is ready:

```bash
# Install dependencies
pnpm install

# Run database migrations
cd apps/api
pnpm prisma:migrate
cd ../..

# Start all development services
pnpm dev

# Or start specific apps
turbo dev --filter=console  # Frontend only
turbo dev --filter=api      # Backend only
```

## Configuration Files

### `devcontainer.json`
Main Dev Container configuration that defines:
- Base image and features
- VSCode extensions and settings
- Port forwarding
- Post-start commands

### `start-infra.sh`
Script that runs after container creation to:
- Create `.env` file from `.env.example` if needed
- Start PostgreSQL and Redis via `docker-compose.infra.yaml`
- Wait for services to be healthy
- Display service status and next steps

## Troubleshooting

### Infrastructure services not starting
Check the logs:
```bash
docker-compose -f docker-compose.infra.yaml logs
```

Restart services:
```bash
docker-compose -f docker-compose.infra.yaml restart
```

### PostgreSQL connection issues
Verify PostgreSQL is running and healthy:
```bash
docker exec fastwreck-postgres pg_isready -U fastwreck
```

### Redis connection issues
Verify Redis is running:
```bash
docker exec fastwreck-redis redis-cli ping
```

### Rebuilding the Dev Container
If you encounter issues, try rebuilding:
1. Press `F1` or `Ctrl+Shift+P` / `Cmd+Shift+P`
2. Select **"Dev Containers: Rebuild Container"**

## Environment Variables

The Dev Container uses the `.env` file for configuration. Key variables:

```env
# Database
POSTGRES_DB=fastwreck
POSTGRES_USER=fastwreck
POSTGRES_PASSWORD=fastwreck_dev_password
DATABASE_URL="postgresql://fastwreck:fastwreck_dev_password@localhost:5432/fastwreck?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT (IMPORTANT: Change in production!)
JWT_SECRET=change-this-to-a-random-jwt-secret-key
JWT_EXPIRES_IN=7d

# Authentication
AUTH_MODE=local  # or 'oidc' for OIDC authentication
```

For full configuration options, see `.env.example`.

## Resources

- [Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
- [Fastwreck Documentation](../README.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
