import { mapPublicBlogPostSummary } from "./blog/data.ts";
import type { BlogPostRecord, ProjectSummary } from "../lib/content/types.ts";

type HomeWritingDataService = {
  listPublicPosts: () => Promise<BlogPostRecord[]>;
};

type HomeFeaturedProjectsDataService = {
  listFeaturedProjects: () => Promise<ProjectSummary[]>;
};

export async function loadHomeWritingData(input: {
  limit?: number;
  service: HomeWritingDataService;
}) {
  const limit = input.limit ?? 3;
  const posts = await input.service.listPublicPosts();

  return {
    posts: posts.slice(0, limit).map(mapPublicBlogPostSummary),
  };
}

export async function loadHomeFeaturedProjectsData(input: {
  limit?: number;
  service: HomeFeaturedProjectsDataService;
}) {
  const limit = input.limit ?? 3;
  const projects = await input.service.listFeaturedProjects();

  return {
    projects: projects.slice(0, limit),
  };
}
