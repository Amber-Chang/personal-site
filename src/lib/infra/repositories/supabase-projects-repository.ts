import { getPublishedProjectBySlug, type Project } from "../../projects.ts";
import type { ProjectsRepository } from "../../content/repository.ts";
import type { ProjectOption, ProjectRecord, ProjectSummary, PublicProjectRecord, SyncProjectInput } from "../../content/types.ts";

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

type QueryClient = {
  from: (table: string) => {
    select: (columns: string) => SelectQuery<ProjectRow>;
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

  async listAdminProjects(): Promise<ProjectRecord[]> {
    const { data, error } = await this.client.from("projects").select("*").order("title", { ascending: true });

    return ensureArray(data, error).map(mapProjectRecord);
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
}
