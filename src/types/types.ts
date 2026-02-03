import { ArticleType } from "@prisma/client";

export interface scheduledPost {
  page: number;
  pageSize: number;
  articleType: ArticleType;
  category: string;
}

export interface scheduledPostArray {
  platform: string;
  date: Date | string;
  time: string;
  isPosted: boolean;
}
