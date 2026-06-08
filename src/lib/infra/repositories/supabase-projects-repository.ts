import { getPublishedProjectBySlug, type Project } from "../../projects.ts";
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
  id: string;
  published_at: string | null;
  slug: string;
  status: "draft" | "published";
  summary: string | null;
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
    id: row.id,
    publishedAt: row.published_at,
    slug: row.slug,
    status: row.status,
    summary: row.summary,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function mapPublicProjectSummary(row: ProjectRow, project: Project): ProjectSummary {
  return {
    id: row.id,
    slug: project.slug,
    summary: project.summary,
    title: project.title,
  };
}

function mapPublicProjectRecord(project: Project, id: string | null): PublicProjectRecord {
  return {
    content: project.content,
    id,
    outcomes: project.outcomes,
    period: project.period,
    role: project.role,
    slug: project.slug,
    summary: project.summary,
    tags: project.tags,
    title: project.title,
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
    slug: input.slug,
    status: input.status ?? "draft",
    summary: input.summary ?? null,
    title: input.title,
  };
}

function mapUpdateInput(input: UpdateProjectInput) {
  return {
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.summary !== undefined ? { summary: input.summary } : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
  };
}

export class SupabaseProjectsRepository implements ProjectsRepository {
  private readonly client: QueryClient;
  private readonly loadProjectBySlug: (slug: string) => Project | null;

  constructor(client: QueryClient, loadProjectBySlug: (slug: string) => Project | null = getPublishedProjectBySlug) {
    this.client = client;
    this.loadProjectBySlug = loadProjectBySlug;
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
      .select("id, slug, title")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    const row = maybeOne(data, error);

    if (!row) {
      return null;
    }

    const project = this.loadProjectBySlug(row.slug);

    return project ? mapPublicProjectSummary(row, project) : null;
  }

  async getPublicProjectBySlug(slug: string): Promise<PublicProjectRecord | null> {
    const project = this.loadProjectBySlug(slug);

    if (!project) {
      return null;
    }

    const { data, error } = await this.client
      .from("projects")
      .select("id, slug, title")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    const row = maybeOne(data, error);

    return mapPublicProjectRecord(project, row?.id ?? null);
  }

  async upsertProject(input: SyncProjectInput): Promise<ProjectRecord> {
    const { data, error } = await this.client
      .from("projects")
      .upsert(
        {
          content_markdown: input.contentMarkdown ?? null,
          published_at: input.publishedAt ?? null,
          slug: input.slug,
          status: input.status,
          summary: input.summary ?? null,
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
