/*
  Warnings:

  - You are about to drop the column `isCancelled` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledDate` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledPlatforms` on the `Article` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledTime` on the `Article` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Article" DROP COLUMN "isCancelled",
DROP COLUMN "scheduledDate",
DROP COLUMN "scheduledPlatforms",
DROP COLUMN "scheduledTime",
ADD COLUMN     "scheduledPosts" JSONB DEFAULT '[]';
