import type { ProjectsRepository } from "../../content/repository.ts";
import type { ProjectOption } from "../../content/types.ts";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
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

type QueryClient = {
  from: (table: string) => {
    select: (columns: string) => SelectQuery<ProjectRow>;
  };
};

function mapProjectRow(row: ProjectRow): ProjectOption {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
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

  async getProjectById(id: string): Promise<ProjectOption | null> {
    const { data, error } = await this.client
      .from("projects")
      .select("id, slug, title")
      .eq("id", id)
      .maybeSingle();

    const row = maybeOne(data, error);

    return row ? mapProjectRow(row) : null;
  }
}
