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

export type ProjectRecord = {
  contentMarkdown: string | null;
  createdAt: string;
  id: string;
  publishedAt: string | null;
  slug: string;
  status: ContentStatus;
  summary: string | null;
  title: string;
  updatedAt: string;
};

export type SyncProjectInput = {
  contentMarkdown?: string | null;
  publishedAt?: string | null;
  slug: string;
  status: ContentStatus;
  summary?: string | null;
  title: string;
};

export type ProjectSummary = ProjectOption & {
  summary: string;
};

export type PublicProjectRecord = {
  content: string;
  id: string | null;
  outcomes: string[];
  period: string;
  role: string;
  slug: string;
  summary: string;
  tags: string[];
  title: string;
};
