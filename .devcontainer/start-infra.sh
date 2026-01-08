#!/bin/bash

# Start infrastructure services script for Dev Container
# This script starts PostgreSQL and Redis using docker-compose

set -e

echo "🚀 Starting Fastwreck infrastructure services..."

# Check if .env file exists, if not copy from .env.example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update JWT_SECRET and other sensitive values in .env file!"
fi

# Start infrastructure services
echo "🐳 Starting PostgreSQL and Redis..."
docker-compose -f docker-compose.infra.yaml up -d

# Wait for PostgreSQL to be healthy
# Note: Container name 'fastwreck-postgres' matches docker-compose.infra.yaml
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker exec fastwreck-postgres pg_isready -U fastwreck > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ PostgreSQL failed to start within ${timeout}s"
    exit 1
fi

# Wait for Redis to be healthy
# Note: Container name 'fastwreck-redis' matches docker-compose.infra.yaml
echo "⏳ Waiting for Redis to be ready..."
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker exec fastwreck-redis redis-cli ping > /dev/null 2>&1; then
        echo "✅ Redis is ready!"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
done

if [ $elapsed -ge $timeout ]; then
    echo "❌ Redis failed to start within ${timeout}s"
    exit 1
fi

# Connect dev container to the docker-compose network so it can reach postgres/redis by hostname
CONTAINER_ID=$(cat /etc/hostname 2>/dev/null || echo "")
if [ -n "$CONTAINER_ID" ]; then
    # Check if already connected
    if ! docker network inspect fastwreck_default --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null | grep -q "$CONTAINER_ID"; then
        echo "🔗 Connecting dev container to fastwreck_default network..."
        docker network connect fastwreck_default "$CONTAINER_ID" 2>/dev/null || true
        echo "✅ Dev container connected to fastwreck_default network"
    else
        echo "✅ Dev container already connected to fastwreck_default network"
    fi
fi

echo ""
echo "✨ Infrastructure services started successfully!"
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.infra.yaml ps
echo ""
echo "🔧 Next steps:"
echo "  1. Install dependencies: pnpm install"
echo "  2. Run database migrations: cd apps/api && pnpm prisma:migrate"
echo "  3. Start development: pnpm dev"
echo ""
