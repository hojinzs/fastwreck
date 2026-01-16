# Fastwreck API

RESTful API for Fastwreck - End-to-end automated content creation platform.

## Features

- **Authentication**
  - Email/password registration and login
  - OIDC authentication (Authentik integration)
  - JWT-based authorization

- **User Management**
  - User profile CRUD operations
  - Role-based access control

- **Workspace Management**
  - Multi-workspace support
  - Team collaboration with role-based permissions (OWNER, ADMIN, MEMBER, VIEWER)
  - Workspace member management

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL with pgvector extension
- **ORM**: Prisma 6
- **Authentication**: Passport (Local, JWT, OIDC)
- **API Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js >= 18
- pnpm 9.0.0
- PostgreSQL 14+ (or use Docker Compose)

## Getting Started

### 1. Install Dependencies

```bash
# From project root
pnpm install
```

### 2. Set Up Infrastructure

Start PostgreSQL and Authentik (optional) using Docker Compose:

```bash
# From project root
docker-compose -f docker-compose.infra.yaml up -d
```

This will start:

- PostgreSQL with pgvector (port 5432)
- Redis (port 6379)
- Authentik server (optional OIDC, port 9000/9443)

### 3. Configure Environment

Copy the example environment file:

```bash
# From project root
cp .env.example .env
```

Edit `.env` and configure:

```env
# Required
DATABASE_URL="postgresql://fastwreck:fastwreck_dev_password@localhost:5432/fastwreck?schema=public"
JWT_SECRET=your-secret-key-here

# Optional (for OIDC)
AUTH_MODE=oidc
OIDC_ISSUER=http://localhost:9000/application/o/fastwreck/
OIDC_CLIENT_ID=your-client-id
OIDC_CLIENT_SECRET=your-client-secret
```

### 4. Run Database Migrations

```bash
cd apps/api
pnpm prisma:migrate
```

### 5. Generate Prisma Client

```bash
cd apps/api
pnpm prisma:generate
```

### 6. Start the Server

```bash
# Development mode (from project root)
pnpm dev

# Or run API only
cd apps/api
pnpm dev
```

The API will be available at:

- Server: http://localhost:4000
- Health check: http://localhost:4000/health
- API Documentation: http://localhost:4000/api

## API Endpoints

### Authentication

| Method | Endpoint              | Description                  | Auth   |
| ------ | --------------------- | ---------------------------- | ------ |
| POST   | `/auth/register`      | Register with email/password | Public |
| POST   | `/auth/login`         | Login with email/password    | Public |
| GET    | `/auth/oidc`          | Initiate OIDC login          | Public |
| GET    | `/auth/oidc/callback` | OIDC callback                | Public |
| GET    | `/auth/me`            | Get current user profile     | JWT    |

### Users

| Method | Endpoint     | Description              | Auth |
| ------ | ------------ | ------------------------ | ---- |
| GET    | `/users`     | Get all users            | JWT  |
| GET    | `/users/me`  | Get current user profile | JWT  |
| GET    | `/users/:id` | Get user by ID           | JWT  |
| PATCH  | `/users/me`  | Update current user      | JWT  |
| PATCH  | `/users/:id` | Update user by ID        | JWT  |
| DELETE | `/users/me`  | Delete current user      | JWT  |
| DELETE | `/users/:id` | Delete user by ID        | JWT  |

### Workspaces

| Method | Endpoint                            | Description            | Auth | Role        |
| ------ | ----------------------------------- | ---------------------- | ---- | ----------- |
| POST   | `/workspaces`                       | Create workspace       | JWT  | -           |
| GET    | `/workspaces`                       | List user's workspaces | JWT  | -           |
| GET    | `/workspaces/:id`                   | Get workspace          | JWT  | Member      |
| PATCH  | `/workspaces/:id`                   | Update workspace       | JWT  | Owner/Admin |
| DELETE | `/workspaces/:id`                   | Delete workspace       | JWT  | Owner       |
| POST   | `/workspaces/:id/members`           | Add member             | JWT  | Owner/Admin |
| PATCH  | `/workspaces/:id/members/:memberId` | Update member role     | JWT  | Owner/Admin |
| DELETE | `/workspaces/:id/members/:memberId` | Remove member          | JWT  | Owner/Admin |

### Ideas

| Method | Endpoint                       | Description                         | Auth |
| ------ | ------------------------------ | ----------------------------------- | ---- |
| POST   | `/ideas`                       | Create idea                         | JWT  |
| GET    | `/ideas`                       | List ideas (workspaceId query)      | JWT  |
| GET    | `/ideas/:id`                   | Get idea detail                     | JWT  |
| PATCH  | `/ideas/:id`                   | Update idea                         | JWT  |
| DELETE | `/ideas/:id`                   | Delete idea                         | JWT  |
| POST   | `/ideas/:id/sources`           | Add idea source                     | JWT  |
| GET    | `/ideas/:id/sources`           | List idea sources                   | JWT  |
| DELETE | `/ideas/:id/sources/:sourceId` | Delete idea source                  | JWT  |
| POST   | `/ideas/search`                | Vector similarity search (internal) | JWT  |

## Database Schema

### User Model

```prisma
model User {
  id         String       @id @default(uuid())
  email      String       @unique
  password   String?      // Nullable for OIDC users
  name       String?
  avatar     String?
  provider   AuthProvider @default(LOCAL)
  providerId String?      // OIDC subject identifier
  isActive   Boolean      @default(true)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
}
```

### Workspace Model

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
```

### WorkspaceMember Model

```prisma
model WorkspaceMember {
  id          String        @id @default(uuid())
  role        WorkspaceRole @default(MEMBER)
  userId      String
  workspaceId String
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

### Roles

- **OWNER**: Full control over workspace, cannot be removed
- **ADMIN**: Can manage workspace settings and members
- **MEMBER**: Can access workspace resources
- **VIEWER**: Read-only access

## Development Commands

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Type check
pnpm check-types

# Prisma commands
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run migrations
pnpm prisma:studio    # Open Prisma Studio
```

## Authentication Modes

### Local Authentication (Default)

Set `AUTH_MODE=local` or leave unset. Users register with email/password.

```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"John Doe"}'

# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### OIDC Authentication (Authentik)

1. Set `AUTH_MODE=oidc` in `.env`
2. Configure Authentik:
   - Create an application in Authentik
   - Set redirect URI: `http://localhost:4000/auth/oidc/callback`
   - Copy client ID and secret to `.env`

3. Users can login via:
   ```
   http://localhost:4000/auth/oidc
   ```

## API Documentation

Interactive API documentation is available at http://localhost:4000/api when the server is running.

The documentation includes:

- Request/response schemas
- Authentication requirements
- Try-it-out functionality

## Error Handling

The API uses standard HTTP status codes:

- `200 OK` - Request succeeded
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

Error responses include a message:

```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

## Security

- Passwords are hashed using bcrypt (10 rounds)
- JWT tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)
- CORS is enabled for frontend (http://localhost:3000)
- Input validation using class-validator
- SQL injection protection via Prisma ORM

## Project Structure

```
apps/api/
├── src/
│   ├── auth/                   # Authentication module
│   │   ├── decorators/         # Custom decorators (CurrentUser)
│   │   ├── dto/                # Data transfer objects
│   │   ├── guards/             # Auth guards (JWT, Local, OIDC)
│   │   ├── strategies/         # Passport strategies
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/                  # User management module
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── workspaces/             # Workspace management module
│   │   ├── dto/
│   │   ├── workspaces.controller.ts
│   │   ├── workspaces.service.ts
│   │   └── workspaces.module.ts
│   ├── prisma/                 # Prisma service
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma           # Database schema
└── package.json
```

## License

See the main project LICENSE file.
