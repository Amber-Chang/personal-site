export type ContentStatus = "draft" | "published";

export type BlogPostRecord = {
  contentMarkdown: string;
  createdAt: string;
  excerpt: string | null;
  id: string;
  publishedAt: string | null;
  relatedProjectId: string | null;
  slug: string;
  status: ContentStatus;
  title: string;
  updatedAt: string;
};

export type CreateBlogPostInput = {
  contentMarkdown: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  relatedProjectId?: string | null;
  slug: string;
  status?: ContentStatus;
  title: string;
};

export type UpdateBlogPostInput = Partial<CreateBlogPostInput>;

export type ProjectOption = {
  id: string;
  slug: string;
  title: string;
};
