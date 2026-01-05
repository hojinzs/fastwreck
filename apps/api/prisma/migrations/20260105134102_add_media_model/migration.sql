-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" "MediaType" NOT NULL,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "storage_type" TEXT NOT NULL DEFAULT 'local',
    "storage_path" TEXT NOT NULL,
    "variants" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "media_workspace_id_idx" ON "media"("workspace_id");

-- CreateIndex
CREATE INDEX "media_uploaded_by_id_idx" ON "media"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "media_type_idx" ON "media"("type");

-- CreateIndex
CREATE INDEX "media_created_at_idx" ON "media"("created_at");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
