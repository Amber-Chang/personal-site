import type { BlogPostsRepository, ProjectsRepository } from "./repository.ts";
import type {
  BlogPostRecord,
  CreateBlogPostInput,
  CreateProjectInput,
  ProjectRecord,
  SyncProjectInput,
  UpdateBlogPostInput,
  UpdateProjectInput,
} from "./types.ts";

export class BlogPostNotFoundError extends Error {
  constructor(id: string) {
    super(`Blog post "${id}" was not found.`);
    this.name = "BlogPostNotFoundError";
  }
}

export class ProjectNotFoundError extends Error {
  constructor(id: string) {
    super(`Project "${id}" was not found.`);
    this.name = "ProjectNotFoundError";
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
  projects: Pick<
    ProjectsRepository,
    | "createProject"
    | "getAdminProjectById"
    | "getProjectById"
    | "getPublicProjectById"
    | "getPublicProjectBySlug"
    | "listAdminProjects"
    | "listProjectOptions"
    | "updateProject"
    | "upsertProject"
  >;
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
    async createProject(inputValue: CreateProjectInput): Promise<ProjectRecord> {
      return input.projects.createProject(inputValue);
    },
    async getAdminProjectById(id: string): Promise<ProjectRecord | null> {
      return input.projects.getAdminProjectById(id);
    },
    async listAdminProjects(): Promise<ProjectRecord[]> {
      return input.projects.listAdminProjects();
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
    async upsertProject(inputValue: SyncProjectInput): Promise<ProjectRecord> {
      return input.projects.upsertProject(inputValue);
    },
    async updateProject(id: string, inputValue: UpdateProjectInput): Promise<ProjectRecord> {
      const existingProject = await input.projects.getAdminProjectById(id);

      if (!existingProject) {
        throw new ProjectNotFoundError(id);
      }

      return input.projects.updateProject(id, inputValue);
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
