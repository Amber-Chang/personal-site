import { createAdminSupabaseClient } from "../supabase/admin.ts";
import { SupabaseBlogPostsRepository } from "./supabase-posts-repository.ts";
import { SupabaseProjectsRepository } from "./supabase-projects-repository.ts";

type QueryClient = {
  from: (table: string) => unknown;
};

export function createAdminContentRepositories(input?: {
  createAdminClient?: () => QueryClient;
}) {
  const client = input?.createAdminClient?.() ?? (createAdminSupabaseClient() as QueryClient);

  return {
    posts: new SupabaseBlogPostsRepository(client),
    projects: new SupabaseProjectsRepository(client),
  };
}
