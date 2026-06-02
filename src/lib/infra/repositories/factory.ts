import { createAdminSupabaseClient } from "../supabase/admin.ts";
import { createPublicSupabaseClient } from "../supabase/public.ts";
import { SupabaseBlogPostsRepository } from "./supabase-posts-repository.ts";
import { SupabaseProjectsRepository } from "./supabase-projects-repository.ts";

type BlogPostsQueryClient = ConstructorParameters<typeof SupabaseBlogPostsRepository>[0];
type ProjectsQueryClient = ConstructorParameters<typeof SupabaseProjectsRepository>[0];
type QueryClient = BlogPostsQueryClient & ProjectsQueryClient;

export function createAdminContentRepositories(input?: {
  createAdminClient?: () => QueryClient;
}) {
  const client = input?.createAdminClient?.() ?? (createAdminSupabaseClient() as QueryClient);

  return {
    posts: new SupabaseBlogPostsRepository(client as BlogPostsQueryClient),
    projects: new SupabaseProjectsRepository(client as ProjectsQueryClient),
  };
}

export function createPublicContentRepositories(input?: {
  createPublicClient?: () => QueryClient;
}) {
  const client = input?.createPublicClient?.() ?? (createPublicSupabaseClient() as QueryClient);

  return {
    posts: new SupabaseBlogPostsRepository(client as BlogPostsQueryClient),
    projects: new SupabaseProjectsRepository(client as ProjectsQueryClient),
  };
}
