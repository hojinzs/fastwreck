CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('NEW', 'IN_REVIEW', 'APPROVED', 'DRAFTED');

-- CreateEnum
CREATE TYPE "IdeaSourceType" AS ENUM ('RSS', 'YOUTUBE', 'MANUAL');

-- CreateTable
CREATE TABLE "ideas" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "IdeaStatus" NOT NULL DEFAULT 'NEW',
    "workspaceId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idea_sources" (
    "id" TEXT NOT NULL,
    "idea_id" TEXT NOT NULL,
    "url" TEXT,
    "content" TEXT NOT NULL,
    "source_type" "IdeaSourceType" NOT NULL DEFAULT 'MANUAL',
    "metadata" JSONB,
    "embedding" vector,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idea_sources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ideas_workspaceId_idx" ON "ideas"("workspaceId");

-- CreateIndex
CREATE INDEX "ideas_createdById_idx" ON "ideas"("createdById");

-- CreateIndex
CREATE INDEX "ideas_status_idx" ON "ideas"("status");

-- CreateIndex
CREATE INDEX "idea_sources_idea_id_idx" ON "idea_sources"("idea_id");

-- CreateIndex
CREATE INDEX "idea_sources_source_type_idx" ON "idea_sources"("source_type");

-- CreateIndex
CREATE INDEX "idea_sources_embedding_idx" ON "idea_sources" USING ivfflat (embedding vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "idea_sources" ADD CONSTRAINT "idea_sources_idea_id_fkey" FOREIGN KEY ("idea_id") REFERENCES "ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
