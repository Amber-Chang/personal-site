import { mapPublicBlogPostSummary } from "./blog/data.ts";
import { normalizeExcerpt } from "../lib/content/excerpt.ts";
import { mapPublicProjectCard } from "../lib/content/public-project.ts";
import type { BlogPostRecord, ProjectSummary } from "../lib/content/types.ts";

const HOME_SECTION_LIMIT = 3;

type HomeWritingDataService = {
  listPublicPosts: () => Promise<BlogPostRecord[]>;
};

type HomeFeaturedProjectsDataService = {
  listPublicProjects: () => Promise<ProjectSummary[]>;
};

// 首頁「精選文章」：依既有排序取前幾篇，摘要經整理；沒有摘要時 excerpt 為 null，卡片只顯示標題。
export async function loadHomeWritingData(input: {
  limit?: number;
  service: HomeWritingDataService;
}) {
  const limit = input.limit ?? HOME_SECTION_LIMIT;
  const posts = await input.service.listPublicPosts();

  return {
    posts: posts.slice(0, limit).map((post) => ({
      ...mapPublicBlogPostSummary(post),
      excerpt: normalizeExcerpt(post.excerpt),
    })),
  };
}

// 首頁「代表案例」：有標 featured 的已上架專案就只放它們（最多 limit 個，不拿一般專案補位）；
// 一個 featured 都沒有時，改放排序最前面的已上架專案，避免首頁出現空區塊。
// 傳入的清單必須已是「已上架、依排序」的結果（listPublicProjects）。
export function selectHomeProjects<T extends { featured: boolean }>(projects: T[], limit = HOME_SECTION_LIMIT): T[] {
  const featured = projects.filter((project) => project.featured);

  return (featured.length > 0 ? featured : projects).slice(0, limit);
}

export async function loadHomeFeaturedProjectsData(input: {
  limit?: number;
  service: HomeFeaturedProjectsDataService;
}) {
  const projects = await input.service.listPublicProjects();

  return {
    projects: selectHomeProjects(projects, input.limit).map((project) => mapPublicProjectCard(project, { highlights: true })),
  };
}
