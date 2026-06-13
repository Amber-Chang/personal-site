export type ContentStatus = "draft" | "published";

export type BlogPostRecord = {
  contentMarkdown: string;
  createdAt: string;
  excerpt: string | null;
  id: string;
  publishedAt: string | null;
  relatedProjectId: string | null;
  sortOrder: number;
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
  sortOrder?: number;
  slug: string;
  status?: ContentStatus;
  title: string;
};

export type UpdateBlogPostInput = Partial<CreateBlogPostInput>;

export type CreateProjectInput = {
  contentMarkdown?: string | null;
  featured?: boolean;
  outcomes?: string[];
  period?: string | null;
  role?: string | null;
  sortOrder?: number;
  slug: string;
  status?: ContentStatus;
  summary?: string | null;
  tags?: string[];
  title: string;
};

export type UpdateProjectInput = Partial<CreateProjectInput>;

export type ProjectOption = {
  id: string;
  slug: string;
  title: string;
};

export type ProjectRecord = {
  contentMarkdown: string | null;
  createdAt: string;
  featured: boolean;
  id: string;
  outcomes: string[];
  period: string | null;
  publishedAt: string | null;
  role: string | null;
  sortOrder: number;
  slug: string;
  status: ContentStatus;
  summary: string | null;
  tags: string[];
  title: string;
  updatedAt: string;
};

export type SyncProjectInput = {
  contentMarkdown?: string | null;
  featured?: boolean;
  outcomes?: string[];
  period?: string | null;
  publishedAt?: string | null;
  role?: string | null;
  sortOrder?: number;
  slug: string;
  status: ContentStatus;
  summary?: string | null;
  tags?: string[];
  title: string;
};

export type ProjectSummary = ProjectOption & {
  featured: boolean;
  outcomes: string[];
  period: string;
  role: string;
  summary: string;
  tags: string[];
};

export type PublicProjectRecord = {
  content: string;
  featured: boolean;
  id: string;
  outcomes: string[];
  period: string;
  role: string;
  slug: string;
  summary: string;
  tags: string[];
  title: string;
};
