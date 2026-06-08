import type {
  BlogPostRecord,
  CreateBlogPostInput,
  ProjectOption,
  ProjectRecord,
  ProjectSummary,
  PublicProjectRecord,
  SyncProjectInput,
  UpdateBlogPostInput,
} from "./types.ts";

export interface BlogPostsRepository {
  createPost(input: CreateBlogPostInput): Promise<BlogPostRecord>;
  getAdminPostById(id: string): Promise<BlogPostRecord | null>;
  getPublishedPostBySlug(slug: string): Promise<BlogPostRecord | null>;
  listAdminPosts(): Promise<BlogPostRecord[]>;
  listPublishedPosts(): Promise<BlogPostRecord[]>;
  listPublishedPostsByProjectId(projectId: string): Promise<BlogPostRecord[]>;
  publishPost(id: string, publishedAt: string): Promise<BlogPostRecord>;
  unpublishPost(id: string): Promise<BlogPostRecord>;
  updatePost(id: string, input: UpdateBlogPostInput): Promise<BlogPostRecord>;
}

export interface ProjectsRepository {
  getProjectById(id: string): Promise<ProjectOption | null>;
  getPublicProjectById(id: string): Promise<ProjectSummary | null>;
  getPublicProjectBySlug(slug: string): Promise<PublicProjectRecord | null>;
  listAdminProjects(): Promise<ProjectRecord[]>;
  listProjectOptions(): Promise<ProjectOption[]>;
  upsertProject(input: SyncProjectInput): Promise<ProjectRecord>;
}
