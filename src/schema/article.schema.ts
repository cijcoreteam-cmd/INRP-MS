import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(1),
});

export const updateArticleSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(1).optional(),
  remarks: z.string().max(500).nullable().optional(),
});

export const listQuerySchema = z.object({
  q: z.string().optional(),
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "REVIEWED",
      "REVERTED",
      "PUBLISHED",
      "SCHEDULED",
    ])
    .optional(),
  reporterId: z.string().optional(),
  from: z.string().optional(), // ISO date
  to: z.string().optional(),
  sort: z.enum(["updatedAt", "createdAt"]).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().optional(),
  pageSize: z.coerce.number().optional(),
});

export const reviewSchema = z.object({
  remarks: z.string().max(500).optional(), // editor note
});

export const revertSchema = z.object({
  remarks: z.string().min(3).max(500), // required
});

export const publishSchema = z.object({
  platform: z.string().min(2),
  publishedUrl: z.string().url().optional(),
});
