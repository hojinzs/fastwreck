-- AlterTable
ALTER TABLE "drafts" ADD COLUMN "temp_content" JSONB;
ALTER TABLE "drafts" ADD COLUMN "temp_content_saved_at" TIMESTAMP(3);
