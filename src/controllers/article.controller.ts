// controllers/article.controller.ts
import { Request, Response } from "express";
import * as service from "../services/article.service";
import { AuthedRequest } from "../middleware/auth";
import { prisma } from "../libs/prisma";
import dayjs from "dayjs";
import { ArticleStatus, ArticleType } from "@prisma/client";
import { scheduledPostArray } from "../types/types";

// Reporter → create draft
export const createDraft = async (req: AuthedRequest, res: Response) => {
  if (req.user?.role !== "REPORTER")
    return res.status(403).json({ error: "Only reporters can create drafts" });
  try {
    const { title, tags, category, content, audio, video, thumbnail, type } =
      req.body;
    const article = await service.createDraft(
      req.user.id,
      title,
      category,
      tags,
      content,
      audio,
      video,
      thumbnail,
      type
    );
    res.status(201).json(article);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Reporter → save draft
export const updateDraft = async (req: AuthedRequest, res: Response) => {
  if (req.user?.role !== "REPORTER")
    return res.status(403).json({ error: "Only reporters can update drafts" });

  try {
    const articleId = parseInt(req.params.id, 10);

    // Extract everything except id
    const {
      title,
      tags,
      category,
      content,
      audio,
      video,
      thumbnail,
      type,
      status,
    } = req.body;

    const article = await service.updateDraft(
      articleId,
      req.user.id,
      title,
      category,
      tags,
      content,
      audio,
      video,
      thumbnail,
      type,
      status
    );

    res.status(200).json(article);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Reporter → submit
export const submitArticle = async (req: AuthedRequest, res: Response) => {
  if (req.user?.role !== "REPORTER")
    return res.status(403).json({ error: "Only reporters can submit" });
  try {
    const {
      title,
      tags,
      category,
      content,
      audio,
      video,
      thumbnail,
      articleId,
      type,
    } = req.body;
    const article = await service.submitArticle(
      articleId ? Number(articleId) : 0,
      req.user.id,
      title,
      tags,
      category,
      content,
      audio,
      video,
      thumbnail,
      type
    );
    res.json(article);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Editor → review
export const reviewArticle = async (req: AuthedRequest, res: Response) => {
  if (req.user?.role !== "EDITOR")
    return res.status(403).json({ error: "Only editors can review" });
  try {
    const { articleId, status, remarks } = req.body;
    const article = await service.reviewArticle(articleId, status, remarks);
    res.json(article);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// Editor → publish
export const publishArticle = async (req: AuthedRequest, res: Response) => {
  if (req.user?.role !== "EDITOR")
    return res.status(403).json({ error: "Only editors can publish" });
  try {
    const { articleId } = req.body;
    const article = await service.publishArticle(articleId);
    res.json(article);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

// controllers/article.controller.ts
export const getStats = async (req: AuthedRequest, res: Response) => {
  try {
    if (req.user?.role !== "REPORTER") {
      return res.status(403).json({ error: "Only reporters can view stats" });
    }
    const stats = await service.getArticleStats(req.user.id);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
export const getUserDrafts = async (req: AuthedRequest, res: Response) => {
  try {
    const reporterId = req.user?.id; // assuming route has /:reporterId
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    if (!reporterId) {
      return res.status(400).json({ error: "Reporter ID is required" });
    }

    const result = await service.getDraftsByAuthor(reporterId, page, pageSize);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching drafts:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
export const getRevertedPosts = async (req: AuthedRequest, res: Response) => {
  if (req.user?.role !== "REPORTER")
    return res
      .status(403)
      .json({ error: "Only reporters can view their reverted posts" });

  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.limit as string) || 10; // ✅ renamed limit → pageSize
    const skip = (page - 1) * pageSize;

    console.log(req.user.id);
    const { data, total } = await service.fetchRevertedPosts(
      req.user.id,
      skip,
      pageSize
    ); // 👈 use id

    res.status(200).json({
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNextPage: skip + pageSize < total,
        hasPrevPage: page > 1,
      },
    });
    // res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getArticle = async (req: AuthedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const article = await service.fetchArticleById(id);

    if (!article) {
      return res.status(404).json({ error: "Article not found" });
    }

    // Role-based access check
    if (req.user?.role === "REPORTER" && article.reporterId !== req.user.id) {
      return res.status(403).json({ error: "Access denied to this article" });
    }

    // Editors/Admins can fetch any
    return res.status(200).json(article);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
};

export const getArticleHistory = async (req: AuthedRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;

    // 🟢 Read from body instead of query
    const {
      search,
      status,
      type,
      category,
      authorsList, // ✅ array or comma string
      reporterId,
      authorId,
      editorId,
      dateRange,
      from,
      to,
      page = 1,
      pageSize = 20,
    } = req.body || {};

    const currentPage = Number(page);
    const size = Number(pageSize);
    const skip = (currentPage - 1) * size;

    const where: any = {};
    const reporter = reporterId || authorId;

    /** 🔹 Role-based logic */
    if (role === "EDITOR") {
      where.status = { not: "DRAFT" };

      if (reporter) {
        where.reporterId = isNaN(Number(reporter))
          ? reporter
          : Number(reporter);
      }

      if (editorId) {
        where.editorId = isNaN(Number(editorId)) ? editorId : Number(editorId);
      }

      // ✅ Handle multi-choice author list
      if (authorsList && authorsList.length > 0) {
        const ids = Array.isArray(authorsList)
          ? authorsList
          : String(authorsList)
              .split(",")
              .map((id) => id.trim())
              .filter(Boolean);

        where.reporterId = { in: ids };
      }
    } else if (role === "REPORTER" && userId) {
      where.reporterId = Number.isNaN(Number(userId)) ? userId : Number(userId);
    }

    /** 🔹 Filters */
    if (status) {
      const statuses = Array.isArray(status)
        ? status
        : status.split(",").map((s: any) => s.trim());
      where.status = { in: statuses };
    }

    if (type) where.type = type;

    if (category) {
      const categories = Array.isArray(category)
        ? category
        : category.split(",").map((c: any) => c.trim());
      where.category = { in: categories };
    }

    if (search) {
      where.OR = [{ title: { contains: search, mode: "insensitive" } }];
    }

    /** 🔹 Date range */
    const today = dayjs();
    if (dateRange) {
      switch (dateRange) {
        case "today":
          where.createdAt = {
            gte: today.startOf("day").toDate(),
            lte: today.endOf("day").toDate(),
          };
          break;
        case "week":
          where.createdAt = {
            gte: today.startOf("week").toDate(),
            lte: today.endOf("week").toDate(),
          };
          break;
        case "month":
          where.createdAt = {
            gte: today.startOf("month").toDate(),
            lte: today.endOf("month").toDate(),
          };
          break;
        default:
          break;
      }
    }

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      };
    }

    /** 🔹 Fetch articles */
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: size,
        orderBy: { updatedAt: "desc" },
        include: {
          reporter: { select: { id: true, username: true, email: true } },
          editor: { select: { id: true, username: true, email: true } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    const totalPages = Math.ceil(total / size);

    return res.json({
      articles,
      pagination: {
        total,
        page: currentPage,
        pageSize: size,
        totalPages,
        hasNextPage: skip + size < total,
        hasPrevPage: currentPage > 1,
      },
    });
  } catch (err) {
    console.error("Error fetching article history:", err);
    return res.status(500).json({ error: "Failed to fetch article history" });
  }
};

export const deleteArticle = async (req: AuthedRequest, res: Response) => {
  try {
    const { articleId } = req.params as { articleId?: string };
    const role = req.user?.role;
    const userId = req.user?.id;

    if (!articleId) {
      return res.status(400).json({ error: "Article ID is required" });
    }

    if (!role || (role !== "REPORTER" && role !== "EDITOR")) {
      return res.status(403).json({ error: "Unauthorized role" });
    }

    const result = await service.deleteArticle(
      Number(articleId),
      userId!,
      role
    );

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export const getEditorStats = async (req: AuthedRequest, res: Response) => {
  try {
    const stats = await service.getStats();
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getReviewArticles = async (req: AuthedRequest, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const size = parseInt((req.query.pageSize as string) || "10", 10);
    const category = req.query.category as string;

    // if (!category) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Category is required to fetch review articles",
    //   });
    // }

    const data = await service.getReviewArticles(page, size, category);
    res.json({ success: true, ...data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const schedulePosts = async (req: AuthedRequest, res: Response) => {
  try {
    const { id, scheduledPosts, isScheduledNow } = req.body as {
      id: string;
      scheduledPosts: scheduledPostArray[];
      isScheduledNow?: boolean;
    };
    if (!id || !scheduledPosts || scheduledPosts.length == 0) {
      return res.status(400).json({
        error: "Article ID and correct scheduledPosts are needed required",
      });
    }
    const data = await service.scheduledPost(
      id,
      scheduledPosts,
      isScheduledNow
    );
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const cancelScheduledPost = async (
  req: AuthedRequest,
  res: Response
) => {
  try {
    const { id } = req.params as { id: string };
    const platform = req.body as string[];
    if (platform.length == 0 || !id) {
      return res.status(400).json({
        error: "Article ID and correct platforms are needed required",
      });
    }
    const data = await service.isCancelledPost(id, platform);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getScheduledPosts = async (req: AuthedRequest, res: Response) => {
  try {
    const { page, pageSize, articleType, category, searchQuery } = req.body as {
      page: number;
      pageSize: number;
      articleType: ArticleType;
      category: string;
      searchQuery?: string;
    };
    const data = await service.fetchScheduledPosts(
      page,
      pageSize,
      articleType,
      category,
      searchQuery
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCalendarData = async (req: AuthedRequest, res: Response) => {
  console.log("Controller hit", req.path, req.params, req.query);

  try {
    const data = await service.fetchCalendarData();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const editorEditArticle = async (req: AuthedRequest, res: Response) => {
  if (req.user?.role !== "EDITOR")
    return res.status(403).json({ error: "Only editors can edit articles" });

  try {
    const articleId = parseInt(req.params.id, 10);
    const {
      title,
      tags,
      category,
      content,
      audioUrl,
      videoUrl,
      thumbnailUrl,
      type,
      status,
      remarks,
    } = req.body;

    const updatedArticle = await service.updateArticle(articleId, req.user.id, {
      title,
      tags,
      category,
      content,
      audioUrl,
      videoUrl,
      thumbnailUrl,
      type,
      status,
      remarks,
    });

    res.status(200).json(updatedArticle);
  } catch (err: any) {
    console.error("❌ Editor edit failed:", err);
    res.status(400).json({ error: err.message });
  }
};

export const getAuthors = async (req: AuthedRequest, res: Response) => {
  try {
    const authors = await prisma.user.findMany({
      where: {
        role: "REPORTER",
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
      orderBy: {
        username: "asc",
      },
    });

    return res.status(200).json(authors);
  } catch (err) {
    console.error("Error fetching authors:", err);
    return res.status(500).json({ error: "Failed to fetch authors" });
  }
};

export const getEditorHistoryStats = async (
  req: AuthedRequest,
  res: Response
) => {
  try {
    const statuses = Object.values(ArticleStatus);

    console.log(statuses, "asdasd");

    const counts = await Promise.all(
      statuses.map(async (status) => {
        const count = await prisma.article.count({
          where: { status },
        });
        return { status, count };
      })
    );

    const formatted = counts.reduce(
      (acc, { status, count }) => ({ ...acc, [status]: count }),
      {} as Record<ArticleStatus, number>
    );

    return res.status(200).json(formatted);
  } catch (error: any) {
    console.error("Error fetching editor history stats:", error);
    return res.status(500).json({
      error: error.message || "Failed to fetch editor history stats",
    });
  }
};

export const getSidebarStats = async (req: AuthedRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: "Role is required" });
    }
    let stats: Record<string, number> = {};
    if (role === "REPORTER") {
      const draft = await prisma.article.count({ where: { status: "DRAFT" } });
      const reverted = await prisma.article.count({
        where: { status: "REVERTED" },
      });
      stats = { DRAFT: draft, REVERTED: reverted };
    } else if (role === "EDITOR") {
      const submitted = await prisma.article.count({
        where: { status: "SUBMITTED" },
      });
      const published = await prisma.article.count({
        where: { status: "PUBLISHED" },
      });
      const scheduled = await prisma.article.count({
        where: { status: "SCHEDULED" },
      });
      const reviewed = await prisma.article.count({
        where: { status: "REVIEWED" },
      });
      stats = {
        SUBMITTED: submitted,
        PUBLISHED: published,
        SCHEDULED: scheduled + reviewed,
      };
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }
    return res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error("Error fetching sidebar stats:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
