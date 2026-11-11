// 功能：sitemap 與 robots 的網址清單邏輯（純函式，方便單元測試）。
// 實際讀資料與輸出由 src/app/sitemap.ts、src/app/robots.ts 負責。

import type { MetadataRoute } from "next";

type SitemapPost = {
  publishedAt?: string | null;
  slug: string;
  status?: "draft" | "published";
  updatedAt?: string | null;
};

type SitemapProject = {
  slug: string;
};

type SitemapContentService<TPost extends SitemapPost, TProject extends SitemapProject> = {
  listPublicPosts: () => Promise<TPost[]>;
  listPublicProjects: () => Promise<TProject[]>;
};

export const STATIC_SITEMAP_PATHS = ["/", "/about", "/blog", "/projects"] as const;

export const ROBOTS_DISALLOWED_PATHS = ["/admin", "/auth", "/api"];

function toAbsoluteUrl(siteUrl: string, pathName: string) {
  return new URL(pathName, siteUrl).toString();
}

export function buildSitemapEntries(input: {
  posts: SitemapPost[];
  projects: SitemapProject[];
  siteUrl: string;
}): MetadataRoute.Sitemap {
  const staticEntries = STATIC_SITEMAP_PATHS.map((pathName) => ({
    url: toAbsoluteUrl(input.siteUrl, pathName),
  }));

  const postEntries = input.posts
    .filter((post) => post.status !== "draft")
    .map((post) => {
      const lastModified = post.updatedAt ?? post.publishedAt ?? undefined;

      return {
        url: toAbsoluteUrl(input.siteUrl, `/blog/${encodeURIComponent(post.slug)}`),
        ...(lastModified ? { lastModified } : {}),
      };
    });

  const projectEntries = input.projects.map((project) => ({
    url: toAbsoluteUrl(input.siteUrl, `/projects/${encodeURIComponent(project.slug)}`),
  }));

  return [...staticEntries, ...postEntries, ...projectEntries];
}

async function listContent<TPost extends SitemapPost, TProject extends SitemapProject>(
  getService: () => SitemapContentService<TPost, TProject>,
) {
  const service = getService();
  const [posts, projects] = await Promise.all([service.listPublicPosts(), service.listPublicProjects()]);

  return { posts, projects };
}

// 先讀正式內容來源；Supabase 連不上時改讀 repo 內 Markdown 備援；兩者都失敗時只列固定頁面，讓 sitemap 一定有回應。
export async function loadSitemapContent<TPost extends SitemapPost, TProject extends SitemapProject>(input: {
  getFallbackService: () => SitemapContentService<TPost, TProject>;
  getPrimaryService: () => SitemapContentService<TPost, TProject>;
  onFallback?: (error: unknown) => void;
}): Promise<{ posts: TPost[]; projects: TProject[]; source: "primary" | "fallback" | "none" }> {
  const reportFallback = input.onFallback ?? ((error: unknown) => console.warn("[sitemap] content source failed", error));

  try {
    return { ...(await listContent(input.getPrimaryService)), source: "primary" };
  } catch (primaryError) {
    reportFallback(primaryError);
  }

  try {
    return { ...(await listContent(input.getFallbackService)), source: "fallback" };
  } catch (fallbackError) {
    reportFallback(fallbackError);
  }

  return { posts: [], projects: [], source: "none" };
}

export function buildRobots(input: { siteUrl: string | null }): MetadataRoute.Robots {
  return {
    rules: {
      allow: "/",
      disallow: ROBOTS_DISALLOWED_PATHS,
      userAgent: "*",
    },
    ...(input.siteUrl ? { sitemap: toAbsoluteUrl(input.siteUrl, "/sitemap.xml") } : {}),
  };
}
