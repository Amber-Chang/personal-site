// 功能：首頁（案例分頁）的資料（SPEC-004）：全部已上架案例，featured 的排前面，其餘照既有排序；以及兩個分頁的數量。

import { mapPublicProjectCard } from "../lib/content/public-project.ts";
import type { BlogPostRecord, ProjectSummary } from "../lib/content/types.ts";

type HomePageDataService = {
  listPublicPosts: () => Promise<BlogPostRecord[]>;
  listPublicProjects: () => Promise<ProjectSummary[]>;
};

// featured 的排前面；同一組內維持傳入的順序（listPublicProjects 已依後台排序）。不改到傳入的陣列。
export function orderHomeProjects<T extends { featured: boolean }>(projects: T[]): T[] {
  return [...projects.filter((project) => project.featured), ...projects.filter((project) => !project.featured)];
}

export async function loadHomePageData(input: { service: HomePageDataService }) {
  const [projects, posts] = await Promise.all([input.service.listPublicProjects(), input.service.listPublicPosts()]);

  return {
    counts: { cases: projects.length, posts: posts.length },
    projects: orderHomeProjects(projects).map(mapPublicProjectCard),
  };
}
