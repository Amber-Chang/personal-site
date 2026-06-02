import type { BlogPostsRepository } from "../../content/repository.ts";
import type { BlogPostRecord, CreateBlogPostInput, UpdateBlogPostInput } from "../../content/types.ts";

type BlogPostRow = {
  content_markdown: string;
  created_at: string;
  excerpt: string | null;
  id: string;
  published_at: string | null;
  related_project_id: string | null;
  slug: string;
  status: "draft" | "published";
  title: string;
  updated_at: string;
};

type QueryError = {
  code?: string;
  details?: string;
  hint?: string;
  message?: string;
} | null;

type QueryArrayResult<T> = Promise<{
  data: T[] | null;
  error: QueryError;
}>;

type QuerySingleResult<T> = Promise<{
  data: T | null;
  error: QueryError;
}>;

type SelectQuery<T> = {
  eq: (column: string, value: unknown) => SelectQuery<T>;
  maybeSingle: () => QuerySingleResult<T>;
  order: (column: string, options: { ascending: boolean }) => QueryArrayResult<T>;
  single: () => QuerySingleResult<T>;
};

type MutationSelectQuery<T> = {
  single: () => QuerySingleResult<T>;
};

type UpdateQuery<T> = {
  eq: (column: string, value: unknown) => {
    select: (columns: string) => MutationSelectQuery<T>;
  };
};

type QueryClient = {
  from: (table: string) => {
    insert: (input: Record<string, unknown>) => {
      select: (columns: string) => MutationSelectQuery<BlogPostRow>;
    };
    select: (columns: string) => SelectQuery<BlogPostRow>;
    update: (input: Record<string, unknown>) => UpdateQuery<BlogPostRow>;
  };
};

function mapBlogPostRow(row: BlogPostRow): BlogPostRecord {
  return {
    contentMarkdown: row.content_markdown,
    createdAt: row.created_at,
    excerpt: row.excerpt,
    id: row.id,
    publishedAt: row.published_at,
    relatedProjectId: row.related_project_id,
    slug: row.slug,
    status: row.status,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function mapCreateInput(input: CreateBlogPostInput) {
  return {
    content_markdown: input.contentMarkdown,
    excerpt: input.excerpt ?? null,
    published_at: input.publishedAt ?? null,
    related_project_id: input.relatedProjectId ?? null,
    slug: input.slug,
    status: input.status ?? "draft",
    title: input.title,
  };
}

function mapUpdateInput(input: UpdateBlogPostInput) {
  return {
    ...(input.contentMarkdown !== undefined ? { content_markdown: input.contentMarkdown } : {}),
    ...(input.excerpt !== undefined ? { excerpt: input.excerpt } : {}),
    ...(input.publishedAt !== undefined ? { published_at: input.publishedAt } : {}),
    ...(input.relatedProjectId !== undefined ? { related_project_id: input.relatedProjectId } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
  };
}

function formatQueryError(error: Exclude<QueryError, null>) {
  if (error.code === "23505") {
    if (error.message?.includes("blog_posts_slug_key") || error.details?.includes("(slug)")) {
      return "這個 slug 已經被其他文章使用，請換一個網址識別字。";
    }

    return "這筆資料和現有內容衝突，請檢查是否有重複值。";
  }

  if (error.message) {
    return error.message;
  }

  if (error.details) {
    return error.details;
  }

  if (error.hint) {
    return error.hint;
  }

  return "Supabase query failed.";
}

function ensureArray<T>(data: T[] | null, error: QueryError | undefined): T[] {
  if (error) {
    throw new Error(formatQueryError(error));
  }

  return data ?? [];
}

function ensureOne<T>(data: T | null, error: QueryError | undefined): T {
  if (error) {
    throw new Error(formatQueryError(error));
  }

  if (!data) {
    throw new Error("Supabase query returned no rows.");
  }

  return data;
}

function maybeOne<T>(data: T | null, error: QueryError | undefined): T | null {
  if (error) {
    throw new Error(formatQueryError(error));
  }

  return data;
}

export class SupabaseBlogPostsRepository implements BlogPostsRepository {
  private readonly client: QueryClient;

  constructor(client: QueryClient) {
    this.client = client;
  }

  async listPublishedPosts(): Promise<BlogPostRecord[]> {
    const { data, error } = await this.client
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    return ensureArray(data, error).map(mapBlogPostRow);
  }

  async getPublishedPostBySlug(slug: string): Promise<BlogPostRecord | null> {
    const { data, error } = await this.client
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    const row = maybeOne(data, error);

    return row ? mapBlogPostRow(row) : null;
  }

  async listAdminPosts(): Promise<BlogPostRecord[]> {
    const { data, error } = await this.client.from("blog_posts").select("*").order("updated_at", { ascending: false });

    return ensureArray(data, error).map(mapBlogPostRow);
  }

  async getAdminPostById(id: string): Promise<BlogPostRecord | null> {
    const { data, error } = await this.client.from("blog_posts").select("*").eq("id", id).maybeSingle();
    const row = maybeOne(data, error);

    return row ? mapBlogPostRow(row) : null;
  }

  async createPost(input: CreateBlogPostInput): Promise<BlogPostRecord> {
    const { data, error } = await this.client
      .from("blog_posts")
      .insert(mapCreateInput(input))
      .select("*")
      .single();

    return mapBlogPostRow(ensureOne(data, error));
  }

  async updatePost(id: string, input: UpdateBlogPostInput): Promise<BlogPostRecord> {
    const { data, error } = await this.client
      .from("blog_posts")
      .update(mapUpdateInput(input))
      .eq("id", id)
      .select("*")
      .single();

    return mapBlogPostRow(ensureOne(data, error));
  }

  async publishPost(id: string, publishedAt: string): Promise<BlogPostRecord> {
    const { data, error } = await this.client
      .from("blog_posts")
      .update({
        published_at: publishedAt,
        status: "published",
      })
      .eq("id", id)
      .select("*")
      .single();

    return mapBlogPostRow(ensureOne(data, error));
  }

  async unpublishPost(id: string): Promise<BlogPostRecord> {
    const { data, error } = await this.client
      .from("blog_posts")
      .update({
        status: "draft",
      })
      .eq("id", id)
      .select("*")
      .single();

    return mapBlogPostRow(ensureOne(data, error));
  }
}
