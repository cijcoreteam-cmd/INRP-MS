export type PageParams = { page?: number; pageSize?: number };
export const parsePage = ({ page = 1, pageSize = 10 }: PageParams) => {
  page = Math.max(1, Number(page));
  pageSize = Math.min(100, Math.max(1, Number(pageSize)));
  return { skip: (page - 1) * pageSize, take: pageSize, page, pageSize };
};
