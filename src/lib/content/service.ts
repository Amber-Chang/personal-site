import type { BlogPostsRepository, ProjectsRepository } from "./repository.ts";
import type { BlogPostRecord, CreateBlogPostInput, UpdateBlogPostInput } from "./types.ts";

export class BlogPostNotFoundError extends Error {
  constructor(id: string) {
    super(`Blog post "${id}" was not found.`);
    this.name = "BlogPostNotFoundError";
  }
}

export function createBlogContentService(input: {
  now?: () => Date;
  posts: Pick<
    BlogPostsRepository,
    | "createPost"
    | "getAdminPostById"
    | "getPublishedPostBySlug"
    | "listAdminPosts"
    | "listPublishedPosts"
    | "listPublishedPostsByProjectId"
    | "publishPost"
    | "updatePost"
  >;
  projects: Pick<ProjectsRepository, "getProjectById" | "getPublicProjectById" | "getPublicProjectBySlug" | "listProjectOptions">;
}) {
  const now = input.now ?? (() => new Date());

  function getPublishedAtForStatus(inputValue: { publishedAt?: string | null; status?: "draft" | "published" }, existingPost?: BlogPostRecord) {
    if (inputValue.status !== "published") {
      return inputValue.publishedAt;
    }

    return existingPost?.publishedAt ?? inputValue.publishedAt ?? now().toISOString();
  }

  return {
    async createPost(inputValue: CreateBlogPostInput): Promise<BlogPostRecord> {
      return input.posts.createPost({
        ...inputValue,
        publishedAt: getPublishedAtForStatus(inputValue),
      });
    },
    async getAdminPostById(id: string): Promise<BlogPostRecord | null> {
      return input.posts.getAdminPostById(id);
    },
    async getPublicPostBySlug(slug: string): Promise<BlogPostRecord | null> {
      return input.posts.getPublishedPostBySlug(slug);
    },
    async listAdminPosts(): Promise<BlogPostRecord[]> {
      return input.posts.listAdminPosts();
    },
    async listProjectOptions() {
      return input.projects.listProjectOptions();
    },
    async getProjectById(id: string) {
      return input.projects.getProjectById(id);
    },
    async getPublicProjectById(id: string) {
      return input.projects.getPublicProjectById(id);
    },
    async getPublicProjectBySlug(slug: string) {
      return input.projects.getPublicProjectBySlug(slug);
    },
    async listPublicPosts(): Promise<BlogPostRecord[]> {
      return input.posts.listPublishedPosts();
    },
    async listPostsByProjectId(projectId: string): Promise<BlogPostRecord[]> {
      return input.posts.listPublishedPostsByProjectId(projectId);
    },
    async publishPost(id: string): Promise<BlogPostRecord> {
      const existingPost = await input.posts.getAdminPostById(id);

      if (!existingPost) {
        throw new BlogPostNotFoundError(id);
      }

      const publishedAt = existingPost.publishedAt ?? now().toISOString();

      return input.posts.publishPost(id, publishedAt);
    },
    async updatePost(id: string, inputValue: UpdateBlogPostInput): Promise<BlogPostRecord> {
      const existingPost = await input.posts.getAdminPostById(id);

      if (!existingPost) {
        throw new BlogPostNotFoundError(id);
      }

      const publishedAt = getPublishedAtForStatus(inputValue, existingPost);

      return input.posts.updatePost(id, {
        ...inputValue,
        ...(publishedAt !== undefined ? { publishedAt } : {}),
      });
    },
  };
}
