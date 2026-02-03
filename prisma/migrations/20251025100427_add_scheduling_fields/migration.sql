/*
  Warnings:

  - The values [CANCELLED] on the enum `ArticleStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ArticleStatus_new" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'REVERTED', 'PUBLISHED', 'SCHEDULED');
ALTER TABLE "public"."Article" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Article" ALTER COLUMN "status" TYPE "public"."ArticleStatus_new" USING ("status"::text::"public"."ArticleStatus_new");
ALTER TYPE "public"."ArticleStatus" RENAME TO "ArticleStatus_old";
ALTER TYPE "public"."ArticleStatus_new" RENAME TO "ArticleStatus";
DROP TYPE "public"."ArticleStatus_old";
ALTER TABLE "public"."Article" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Article" ADD COLUMN     "isCancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledDate" TIMESTAMP(3),
ADD COLUMN     "scheduledPlatforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "scheduledTime" TEXT;
