// services/article.service.ts
import {
  PrismaClient,
  ArticleStatus,
  ArticleType,
  Prisma,
} from "@prisma/client";
import { scheduledPostArray } from "../types/types";
const prisma = new PrismaClient();

// Reporter creates draft
export const createDraft = async (
  reporterId: string,
  title: string,
  category: string,
  tags: string[] | null,
  content: string,
  audio: string,
  video: string,
  thumbnail: string,
  type: string
) => {
  return prisma.article.create({
    data: {
      title,
      content,
      reporter: {
        connect: { id: reporterId }, // ✅ proper relation
      },
      tags: tags ?? [],
      category: category,
      status: "DRAFT",
      audioUrl: audio,
      videoUrl: video,
      thumbnailUrl: thumbnail,
      type: type,
    },
  });
};

// Reporter submits draft for review
export const submitArticle = async (
  articleId: number,
  reporterId: string,
  title: string,
  tags: string[] | null,
  category: string,
  content: string,
  audio: string,
  video: string,
  thumbnail: string,
  type: string
) => {
  if (!articleId) {
    return prisma.article.create({
      data: {
        title,
        content,
        reporterId,
        tags: tags ?? [],
        category: category,
        status: "SUBMITTED",
        audioUrl: audio,
        videoUrl: video,
        thumbnailUrl: thumbnail,
        type: type,
      },
    });
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });

  if (!article || article.reporterId !== reporterId)
    throw new Error("Not allowed");

  return prisma.article.update({
    where: { id: articleId },
    data: {
      ...(title && { title }),
      ...(content && { content }),
      ...(tags && { tags }),
      ...(category && { category }),
      ...(audio && { audioUrl: audio }),
      ...(video && { videoUrl: video }),
      ...(thumbnail && { thumbnailUrl: thumbnail }),
      ...(type && { type }),
      status: "SUBMITTED",
    },
  });
};

// Editor reviews + add remarks
export const reviewArticle = async (
  articleId: number,
  status: ArticleStatus,
  remarks?: string
) => {
  return prisma.article.update({
    where: { id: articleId },
    data: {
      status,
      remarks: status === "REVERTED" ? remarks ?? "" : "",
    },
  });
};

// Editor publishes
export const publishArticle = async (articleId: number) => {
  return prisma.article.update({
    where: { id: articleId },
    data: { status: "PUBLISHED" },
  });
};

// Reporter updates a saved draft (before submission)
export const updateDraft = async (
  articleId: number,
  reporterId: string,
  title?: string,
  category?: string,
  tags?: string[],
  content?: string,
  audio?: string,
  video?: string,
  thumbnail?: string,
  type?: string,
  status?: ArticleStatus
) => {
  const article = await prisma.article.findUnique({ where: { id: articleId } });

  if (!article) {
    throw new Error("Article not found");
  }
  if (article.reporterId !== reporterId) {
    throw new Error("Not allowed to edit this draft");
  }
  if (article.status !== "DRAFT" && article.status !== "REVERTED") {
    throw new Error("Only drafts can be edited");
  }

  return prisma.article.update({
    where: { id: articleId },
    data: {
      ...(title !== undefined && { title }),
      ...(category !== undefined && { category }),
      ...(tags !== undefined && { tags }),
      ...(content !== undefined && { content }),
      ...(audio !== undefined && { audioUrl: audio }),
      ...(video !== undefined && { videoUrl: video }),
      ...(thumbnail !== undefined && { thumbnailUrl: thumbnail }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status: status }),

      updatedAt: new Date(),
    },
  });
};

// Editor updates article (after submission)
export const updateArticle = async (
  articleId: number,
  editorId: string,
  data: {
    title?: string;
    category?: string;
    tags?: string[];
    content?: any;
    audioUrl?: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    type?: string;
    status?: ArticleStatus;
    remarks?: string;
  }
) => {
  // 1️⃣ Find the article
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) throw new Error("Article not found");

  // 2️⃣ Editor permission logic
  // Editors can only edit reporter-owned articles, not their own submissions.
  if (!article.reporterId)
    throw new Error("Invalid article — no reporter assigned");

  // 3️⃣ Perform update
  const updated = await prisma.article.update({
    where: { id: articleId },
    data: {
      ...data,
      editorId, // track who edited it
      updatedAt: new Date(),
    },
  });

  return updated;
};

// Get stats for all article statuses
export const getArticleStats = async (reporterId: string) => {
  const stats = await prisma.article.groupBy({
    by: ["status"],
    where: { reporterId: reporterId }, // 👈 filter by reporter
    _count: { status: true },
  });

  interface ArticleStats {
    DRAFT: number;
    SUBMITTED: number;
    REVIEWED: number;
    REVERTED: number;
    PUBLISHED: number;
  }

  // Ensure all enum values are included (even if count = 0)
  const result: Record<ArticleStatus, number> = {
    DRAFT: 0,
    SUBMITTED: 0,
    REVIEWED: 0,
    REVERTED: 0,
    PUBLISHED: 0,
    SCHEDULED: 0,
    POSTED: 0,
  };

  stats.forEach((s: any) => {
    if (s.status === "SCHEDULED" || s.status === "POSTED") return;
    result[s.status as ArticleStatus] = s._count.status;
  });

  // Get total post count
  const total = await prisma.article.count({
    where: { reporterId: reporterId },
  });
  return {
    ...result,
    TOTAL: total,
  };
};

export const getDraftsByAuthor = async (
  reporterId: string,
  page: number = 1,
  pageSize: number = 10
) => {
  const skip = (page - 1) * pageSize;

  const [drafts, total] = await Promise.all([
    prisma.article.findMany({
      where: {
        reporterId,
        status: "DRAFT",
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.article.count({
      where: {
        reporterId,
        status: "DRAFT",
      },
    }),
  ]);

  return {
    drafts,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: skip + pageSize < total,
      hasPrevPage: page > 1,
    },
  };
};

export const fetchRevertedPosts = async (
  reporterId: string,
  skip: number,
  limit: number
) => {
  const [data, total] = await Promise.all([
    prisma.article.findMany({
      where: {
        reporterId,
        status: "REVERTED",
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        type: true,
        content: true,
        remarks: true,
        audioUrl: true,
        videoUrl: true,
        thumbnailUrl: true,
        createdAt: true,
        updatedAt: true,
        editor: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    }),
    prisma.article.count({
      where: {
        reporterId,
        status: "REVERTED",
      },
    }),
  ]);

  return { data, total };
};

export const fetchArticleById = async (articleId: string) => {
  const numericId = Number(articleId); // 👈 convert to number
  if (isNaN(numericId)) {
    throw new Error("Invalid article ID");
  }
  return prisma.article.findUnique({
    where: { id: numericId },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      status: true,
      remarks: true,
      audioUrl: true,
      videoUrl: true,
      thumbnailUrl: true,
      category: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      reporterId: true,
      scheduledPosts: true,
      reporter: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      editor: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });
};

export const deleteArticle = async (
  articleId: number,
  userId: string,
  role: "REPORTER" | "EDITOR"
) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
  });

  if (!article) {
    throw new Error("Article not found");
  }

  // Reporters can only delete their own articles
  if (role === "REPORTER" && article.reporterId !== userId) {
    throw new Error("Not allowed to delete this article");
  }

  // Editor can delete any article
  await prisma.article.delete({
    where: { id: articleId },
  });

  return { message: "Article deleted successfully" };
};

export const getStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySubmissions = await prisma.article.count({
    where: { createdAt: { gte: today } },
  });

  const pendingReviews = await prisma.article.count({
    where: { status: "SUBMITTED" },
  });

  const revertedSubmissions = await prisma.article.count({
    where: { status: "REVERTED" },
  });

  const approvedToPublish = await prisma.article.count({
    where: { status: "REVIEWED" },
  });

  const scheduledPosts = await prisma.article.count({
    where: { status: "PUBLISHED" },
  });

  return {
    todaySubmissions,
    pendingReviews,
    revertedSubmissions,
    approvedToPublish,
    scheduledPosts,
  };
};

// ----------------- Get Review Articles (Paginated) -----------------
export const getReviewArticles = async (
  page: number,
  size: number,
  category?: string
) => {
  const skip = (page - 1) * size;
  const where: any = { status: "SUBMITTED" };
  if (category && category.trim() !== "") {
    where.category = category;
  }
  const total = await prisma.article.count({
    where,
  });

  const articles = await prisma.article.findMany({
    where,
    skip,
    take: size,
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: { id: true, username: true, email: true },
      },
    },
  });

  return {
    data: articles,
    pagination: {
      total,
      page,
      pageSize: size,
      totalPages: Math.ceil(total / size),
      hasNextPage: skip + size < total,
      hasPrevPage: page > 1,
    },
  };
};

export const scheduledPost = async (
  id: string,
  scheduledPosts: scheduledPostArray[],
  isScheduledNow?: boolean
) => {
  const article = await prisma.article.findUnique({
    where: { id: Number(id) },
  });
  const existing =
    (article?.scheduledPosts as unknown as scheduledPostArray[]) || [];

  const merged = [...existing, ...scheduledPosts];

  const unique = Object.values(
    merged.reduce((acc, item) => {
      acc[item.platform] = item;
      return acc;
    }, {} as Record<string, scheduledPostArray>)
  );
  const updatedArticle = await prisma.article.update({
    where: { id: Number(id) },
    data: {
      scheduledPosts: unique as unknown as Prisma.InputJsonValue,
      status: "SCHEDULED",
    },
  });

  return {
    message: "Post is scheduled successfully",
    status: 200,
    scheduledPosts,
  };
};

export const isCancelledPost = async (id: string, platforms: string[]) => {
  const article = await prisma.article.findUnique({
    where: { id: Number(id) },
  });

  if (!article) {
    return { message: "Article not found", status: 404 };
  }

  const existing =
    (article.scheduledPosts as unknown as scheduledPostArray[]) || [];

  const updated = existing.filter((p) => !platforms.includes(p.platform));

  let newStatus: ArticleStatus;

  if (updated.length === 0) {
    newStatus = "REVIEWED";
  } else {
    const allPosted = updated.every((p) => p.isPosted);
    newStatus = allPosted ? "POSTED" : "SCHEDULED";
  }

  await prisma.article.update({
    where: { id: Number(id) },
    data: {
      scheduledPosts: updated as unknown as Prisma.InputJsonValue,
      status: newStatus,
    },
  });

  return {
    message: "Post cancelled successfully",
    status: 200,
  };
};

export const fetchScheduledPosts = async (
  page: number = 1,
  pageSize: number = 10,
  articleType: ArticleType,
  category: string,
  searchquery?: string
) => {
  const skip = (page - 1) * pageSize;

  const whereClause: any = {};

  if (articleType) {
    whereClause.status = articleType;
  }

  if (category) {
    whereClause.category = category;
  }

  if (searchquery) {
    whereClause.title = {
      contains: searchquery,
      mode: "insensitive",
    };
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { createdAt: "asc" },
      include: {
        reporter: { select: { id: true, username: true, email: true } },
      },
    }),
    prisma.article.count({ where: whereClause }),
  ]);

  const result = articles.map((article) => ({
    id: article.id,
    title: article.title,
    createdAt: article.createdAt,
    articleType: article.type,
    type: article.status,
    category: article.category,
    audioUrl: article.audioUrl,
    videoUrl: article.videoUrl,
    thumbnailUrl: article.thumbnailUrl,
    scheduledPosts: article.scheduledPosts as unknown as scheduledPostArray[],
    author: article.reporter.username,
  }));

  return {
    articles: result,
    status: 200,
    pagination: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: skip + pageSize < total,
      hasPrevPage: page > 1,
    },
  };
};

export const fetchCalendarData = async () => {
  const articles = await prisma.article.findMany({
    where: {
      status: {
        in: ["SCHEDULED", "POSTED"],
      },
    },
    select: {
      id: true,
      title: true,
      scheduledPosts: true,
      audioUrl: true,
      videoUrl: true,
      thumbnailUrl: true,
      status: true,
      content: true,
      type: true,
    },
  });

  const resultArticle = articles.flatMap((article) =>
    (article.scheduledPosts as unknown as scheduledPostArray[]).map((sp) => ({
      id: `${article.id}`,
      title: `${article.title} - (${sp.platform})`,
      articleId: article.id,
      platform: sp.platform,
      isPosted: sp.isPosted,
      type: article.type,
      audioUrl: article.audioUrl,
      videoUrl: article.videoUrl,
      thumbnailUrl: article.thumbnailUrl,
      status: article.status,
      content: article.content,
      scheduledDate: sp.date,
    }))
  );
  return resultArticle;
};
