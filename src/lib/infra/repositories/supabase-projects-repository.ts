import type { ProjectsRepository } from "../../content/repository.ts";
import type {
  CreateProjectInput,
  ProjectOption,
  ProjectRecord,
  ProjectSummary,
  PublicProjectRecord,
  SyncProjectInput,
  UpdateProjectInput,
} from "../../content/types.ts";

type ProjectRow = {
  content_markdown: string | null;
  created_at: string;
  featured: boolean | null;
  id: string;
  outcomes: string[] | null;
  period: string | null;
  published_at: string | null;
  role: string | null;
  slug: string;
  status: "draft" | "published";
  summary: string | null;
  tags: string[] | null;
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
};

type UpsertQuery<T> = {
  maybeSingle: () => QuerySingleResult<T>;
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
      select: (columns: string) => MutationSelectQuery<ProjectRow>;
    };
    select: (columns: string) => SelectQuery<ProjectRow>;
    update: (input: Record<string, unknown>) => UpdateQuery<ProjectRow>;
    upsert: (values: Record<string, unknown>, options: { onConflict: string }) => {
      select: (columns: string) => UpsertQuery<ProjectRow>;
    };
  };
};

function mapProjectRow(row: ProjectRow): ProjectOption {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
  };
}

function mapProjectRecord(row: ProjectRow): ProjectRecord {
  return {
    contentMarkdown: row.content_markdown,
    createdAt: row.created_at,
    featured: Boolean(row.featured),
    id: row.id,
    outcomes: row.outcomes ?? [],
    period: row.period,
    publishedAt: row.published_at,
    role: row.role,
    slug: row.slug,
    status: row.status,
    summary: row.summary,
    tags: row.tags ?? [],
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function mapPublicProjectSummary(row: ProjectRow): ProjectSummary {
  return {
    featured: Boolean(row.featured),
    id: row.id,
    outcomes: row.outcomes ?? [],
    period: row.period ?? "",
    role: row.role ?? "",
    slug: row.slug,
    summary: row.summary ?? "",
    tags: row.tags ?? [],
    title: row.title,
  };
}

function mapPublicProjectRecord(row: ProjectRow): PublicProjectRecord {
  return {
    content: row.content_markdown ?? "",
    featured: Boolean(row.featured),
    id: row.id,
    outcomes: row.outcomes ?? [],
    period: row.period ?? "",
    role: row.role ?? "",
    slug: row.slug,
    summary: row.summary ?? "",
    tags: row.tags ?? [],
    title: row.title,
  };
}

function formatQueryError(error: Exclude<QueryError, null>) {
  if (error.code === "23505") {
    if (error.message?.includes("projects_slug_key") || error.details?.includes("(slug)")) {
      return "這個 slug 已經被其他專案使用，請換一個網址識別字。";
    }

    return "這筆資料和現有專案衝突，請檢查是否有重複值。";
  }

  return error.message ?? error.details ?? error.hint ?? "Supabase query failed.";
}

function ensureArray<T>(data: T[] | null, error: QueryError | undefined): T[] {
  if (error) {
    throw new Error(formatQueryError(error));
  }

  return data ?? [];
}

function maybeOne<T>(data: T | null, error: QueryError | undefined): T | null {
  if (error) {
    throw new Error(formatQueryError(error));
  }

  return data;
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

function mapCreateInput(input: CreateProjectInput) {
  return {
    content_markdown: input.contentMarkdown ?? null,
    featured: input.featured ?? false,
    outcomes: input.outcomes ?? [],
    period: input.period ?? null,
    role: input.role ?? null,
    slug: input.slug,
    status: input.status ?? "draft",
    summary: input.summary ?? null,
    tags: input.tags ?? [],
    title: input.title,
  };
}

function mapUpdateInput(input: UpdateProjectInput) {
  return {
    ...(input.contentMarkdown !== undefined ? { content_markdown: input.contentMarkdown } : {}),
    ...(input.featured !== undefined ? { featured: input.featured } : {}),
    ...(input.outcomes !== undefined ? { outcomes: input.outcomes } : {}),
    ...(input.period !== undefined ? { period: input.period } : {}),
    ...(input.role !== undefined ? { role: input.role } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.tags !== undefined ? { tags: input.tags } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
  };
}

export class SupabaseProjectsRepository implements ProjectsRepository {
  private readonly client: QueryClient;

  constructor(client: QueryClient) {
    this.client = client;
  }

  async listProjectOptions(): Promise<ProjectOption[]> {
    const { data, error } = await this.client
      .from("projects")
      .select("id, slug, title")
      .eq("status", "published")
      .order("title", { ascending: true });

    return ensureArray(data, error).map(mapProjectRow);
  }

  async createProject(input: CreateProjectInput): Promise<ProjectRecord> {
    const { data, error } = await this.client.from("projects").insert(mapCreateInput(input)).select("*").single();

    return mapProjectRecord(ensureOne(data, error));
  }

  async listAdminProjects(): Promise<ProjectRecord[]> {
    const { data, error } = await this.client.from("projects").select("*").order("title", { ascending: true });

    return ensureArray(data, error).map(mapProjectRecord);
  }

  async listPublishedProjects(): Promise<ProjectSummary[]> {
    const { data, error } = await this.client
      .from("projects")
      .select("id, slug, title, summary, role, period, tags, outcomes, featured, published_at, status")
      .eq("status", "published")
      .order("title", { ascending: true });

    return ensureArray(data, error).map(mapPublicProjectSummary);
  }

  async listFeaturedProjects(): Promise<ProjectSummary[]> {
    return (await this.listPublishedProjects()).filter((project) => project.featured);
  }

  async getAdminProjectById(id: string): Promise<ProjectRecord | null> {
    const { data, error } = await this.client.from("projects").select("*").eq("id", id).maybeSingle();
    const row = maybeOne(data, error);

    return row ? mapProjectRecord(row) : null;
  }

  async getProjectById(id: string): Promise<ProjectOption | null> {
    const { data, error } = await this.client
      .from("projects")
      .select("id, slug, title")
      .eq("id", id)
      .maybeSingle();

    const row = maybeOne(data, error);

    return row ? mapProjectRow(row) : null;
  }

  async getPublicProjectById(id: string): Promise<ProjectSummary | null> {
    const { data, error } = await this.client
      .from("projects")
      .select("id, slug, title, summary, role, period, tags, outcomes, featured, published_at, status")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    const row = maybeOne(data, error);

    return row ? mapPublicProjectSummary(row) : null;
  }

  async getPublicProjectBySlug(slug: string): Promise<PublicProjectRecord | null> {
    const { data, error } = await this.client
      .from("projects")
      .select("id, slug, title, summary, role, period, tags, outcomes, featured, content_markdown, published_at, status")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    const row = maybeOne(data, error);

    return row ? mapPublicProjectRecord(row) : null;
  }

  async upsertProject(input: SyncProjectInput): Promise<ProjectRecord> {
    const { data, error } = await this.client
      .from("projects")
      .upsert(
        {
          content_markdown: input.contentMarkdown ?? null,
          featured: input.featured ?? false,
          outcomes: input.outcomes ?? [],
          period: input.period ?? null,
          published_at: input.publishedAt ?? null,
          role: input.role ?? null,
          slug: input.slug,
          status: input.status,
          summary: input.summary ?? null,
          tags: input.tags ?? [],
          title: input.title,
        },
        { onConflict: "slug" },
      )
      .select("*")
      .maybeSingle();

    const row = maybeOne(data, error);

    if (!row) {
      throw new Error(`Project upsert for slug "${input.slug}" returned no row.`);
    }

    return mapProjectRecord(row);
  }

  async updateProject(id: string, input: UpdateProjectInput): Promise<ProjectRecord> {
    const { data, error } = await this.client.from("projects").update(mapUpdateInput(input)).eq("id", id).select("*").single();

    return mapProjectRecord(ensureOne(data, error));
  }
}
