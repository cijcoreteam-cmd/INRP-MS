-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('EDITOR', 'REPORTER');

-- CreateEnum
CREATE TYPE "public"."ArticleStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'REVERTED', 'PUBLISHED','SCHEDULED','POSTED');

-- CreateEnum
CREATE TYPE "public"."ArticleType" AS ENUM ('TEXT', 'AUDIO', 'VIDEO');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Article" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "status" "public"."ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "reporterId" TEXT NOT NULL,
    "editorId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "content" JSONB NOT NULL,
    "category" TEXT,
    "tags" JSONB,
    "audioUrl" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArticleRevision" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,
    "editorId" TEXT,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ArticlePublication" (
    "id" SERIAL NOT NULL,
    "articleId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "publishedUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticlePublication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "Article_reporterId_idx" ON "public"."Article"("reporterId");

-- CreateIndex
CREATE INDEX "Article_editorId_idx" ON "public"."Article"("editorId");

-- CreateIndex
CREATE INDEX "ArticleRevision_articleId_idx" ON "public"."ArticleRevision"("articleId");

-- CreateIndex
CREATE INDEX "ArticleRevision_editorId_idx" ON "public"."ArticleRevision"("editorId");

-- CreateIndex
CREATE INDEX "ArticlePublication_articleId_idx" ON "public"."ArticlePublication"("articleId");

-- CreateIndex
CREATE INDEX "ArticlePublication_platform_idx" ON "public"."ArticlePublication"("platform");

-- AddForeignKey
ALTER TABLE "public"."Article" ADD CONSTRAINT "Article_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Article" ADD CONSTRAINT "Article_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArticleRevision" ADD CONSTRAINT "ArticleRevision_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArticleRevision" ADD CONSTRAINT "ArticleRevision_editorId_fkey" FOREIGN KEY ("editorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ArticlePublication" ADD CONSTRAINT "ArticlePublication_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
