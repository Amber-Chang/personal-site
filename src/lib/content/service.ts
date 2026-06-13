import type { BlogPostsRepository, ProjectsRepository } from "./repository.ts";
import type {
  BlogPostRecord,
  ContentStatus,
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

export class PublishedContentDeletionError extends Error {
  readonly contentType: string;
  readonly id: string;

  constructor(contentType: string, id: string) {
    super(`已上架${contentType}不能直接刪除，請先下架再刪除。`);
    this.name = "PublishedContentDeletionError";
    this.contentType = contentType;
    this.id = id;
  }
}

export class InvalidContentOrderError extends Error {
  readonly contentType: string;

  constructor(contentType: string, reason: string) {
    super(`${contentType}排序資料${reason}`);
    this.name = "InvalidContentOrderError";
    this.contentType = contentType;
  }
}

function getPublishedAtForStatus(inputValue: { publishedAt?: string | null; status?: ContentStatus }, existingPost?: BlogPostRecord, now?: () => Date) {
  if (inputValue.status !== "published") {
    return inputValue.publishedAt;
  }

  return existingPost?.publishedAt ?? inputValue.publishedAt ?? now?.().toISOString();
}

function assertDraftBeforeDelete(status: ContentStatus, contentType: string, id: string) {
  if (status === "published") {
    throw new PublishedContentDeletionError(contentType, id);
  }
}

function assertValidOrder(contentType: string, idsInOrder: string[], currentIds: string[]) {
  if (idsInOrder.length === 0) {
    throw new InvalidContentOrderError(contentType, "不可為空。");
  }

  if (new Set(idsInOrder).size !== idsInOrder.length) {
    throw new InvalidContentOrderError(contentType, "不可包含重複 id。");
  }

  if (idsInOrder.length !== currentIds.length) {
    throw new InvalidContentOrderError(contentType, "必須包含目前全部內容。");
  }

  const currentIdSet = new Set(currentIds);

  for (const id of idsInOrder) {
    if (!currentIdSet.has(id)) {
      throw new InvalidContentOrderError(contentType, "必須包含目前全部內容。");
    }
  }
}

export function createBlogContentService(input: {
  now?: () => Date;
  posts: Pick<
    BlogPostsRepository,
    | "createPost"
    | "deletePost"
    | "getAdminPostById"
    | "getPublishedPostBySlug"
    | "listAdminPosts"
    | "listPublishedPosts"
    | "listPublishedPostsByProjectId"
    | "publishPost"
    | "reorderPosts"
    | "updatePost"
  >;
  projects: Pick<
    ProjectsRepository,
    | "createProject"
    | "deleteProject"
    | "getAdminProjectById"
    | "getProjectById"
    | "getPublicProjectById"
    | "getPublicProjectBySlug"
    | "listAdminProjects"
    | "listFeaturedProjects"
    | "listPublishedProjects"
    | "listProjectOptions"
    | "reorderProjects"
    | "updateProject"
    | "upsertProject"
  >;
}) {
  const now = input.now ?? (() => new Date());

  return {
    async createPost(inputValue: CreateBlogPostInput): Promise<BlogPostRecord> {
      return input.posts.createPost({
        ...inputValue,
        publishedAt: getPublishedAtForStatus(inputValue, undefined, now),
      });
    },
    async deletePost(id: string): Promise<void> {
      const existingPost = await input.posts.getAdminPostById(id);

      if (!existingPost) {
        throw new BlogPostNotFoundError(id);
      }

      assertDraftBeforeDelete(existingPost.status, "文章", id);

      await input.posts.deletePost(id);
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
    async deleteProject(id: string): Promise<void> {
      const existingProject = await input.projects.getAdminProjectById(id);

      if (!existingProject) {
        throw new ProjectNotFoundError(id);
      }

      assertDraftBeforeDelete(existingProject.status, "專案", id);

      await input.projects.deleteProject(id);
    },
    async getAdminProjectById(id: string): Promise<ProjectRecord | null> {
      return input.projects.getAdminProjectById(id);
    },
    async listAdminProjects(): Promise<ProjectRecord[]> {
      return input.projects.listAdminProjects();
    },
    async listPublicProjects() {
      return input.projects.listPublishedProjects();
    },
    async listFeaturedProjects() {
      return input.projects.listFeaturedProjects();
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
    async reorderPosts(idsInOrder: string[]): Promise<void> {
      const currentIds = (await input.posts.listAdminPosts()).map((post) => post.id);

      assertValidOrder("文章", idsInOrder, currentIds);

      await input.posts.reorderPosts(idsInOrder);
    },
    async reorderProjects(idsInOrder: string[]): Promise<void> {
      const currentIds = (await input.projects.listAdminProjects()).map((project) => project.id);

      assertValidOrder("專案", idsInOrder, currentIds);

      await input.projects.reorderProjects(idsInOrder);
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

      const publishedAt = getPublishedAtForStatus(inputValue, existingPost, now);

      return input.posts.updatePost(id, {
        ...inputValue,
        ...(publishedAt !== undefined ? { publishedAt } : {}),
      });
    },
  };
}
