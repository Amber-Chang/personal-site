import type { BlogPostRecord, ProjectOption } from "../../../lib/content/types.ts";

type AdminPostsDataService = {
  getAdminPostById: (id: string) => Promise<BlogPostRecord | null>;
  getProjectById: (id: string) => Promise<ProjectOption | null>;
  listAdminPosts: () => Promise<BlogPostRecord[]>;
  listProjectOptions: () => Promise<ProjectOption[]>;
};

export async function loadAdminPostsPageData(input: {
  service: Pick<AdminPostsDataService, "listAdminPosts">;
}) {
  return {
    posts: await input.service.listAdminPosts(),
  };
}

export async function loadAdminPostCreatePageData(input: {
  service: Pick<AdminPostsDataService, "listProjectOptions">;
}) {
  return {
    projectOptions: await input.service.listProjectOptions(),
  };
}

export async function loadAdminPostEditPageData(input: {
  id: string;
  service: Pick<AdminPostsDataService, "getAdminPostById" | "getProjectById" | "listProjectOptions">;
}) {
  const [post, projectOptions] = await Promise.all([
    input.service.getAdminPostById(input.id),
    input.service.listProjectOptions(),
  ]);

  if (!post) {
    return null;
  }

  if (post.relatedProjectId && !projectOptions.some((project) => project.id === post.relatedProjectId)) {
    const relatedProject = await input.service.getProjectById(post.relatedProjectId);

    if (relatedProject) {
      projectOptions.push(relatedProject);
    }
  }

  return {
    post,
    projectOptions,
  };
}
