// 功能：/sitemap.xml，列出公開頁面與所有已上架的文章、作品，讓搜尋引擎知道有哪些頁面。

import type { MetadataRoute } from "next";
import { createMarkdownPublicContentRepositories } from "@/lib/infra/repositories/markdown-public-repositories";
import { readSiteUrl } from "@/lib/infra/supabase/env";
import { getPublicBlogContentService } from "./blog/blog-context";
import { buildSitemapEntries, loadSitemapContent } from "./sitemap-data";

// 每小時重新產生一次，新上架的文章不用重新部署也會出現在 sitemap。
export const revalidate = 3600;

function getMarkdownFallbackService() {
  const repositories = createMarkdownPublicContentRepositories();

  return {
    listPublicPosts: () => repositories.posts.listPublishedPosts(),
    listPublicProjects: () => repositories.projects.listPublishedProjects(),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = readSiteUrl();

  if (!siteUrl || !URL.canParse(siteUrl)) {
    return [];
  }

  const { posts, projects } = await loadSitemapContent({
    getFallbackService: getMarkdownFallbackService,
    getPrimaryService: getPublicBlogContentService,
  });

  return buildSitemapEntries({ posts, projects, siteUrl });
}
