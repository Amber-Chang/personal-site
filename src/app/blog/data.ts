import { normalizeExcerpt } from "../../lib/content/excerpt.ts";
import { mapPublicPostSummary, mapPublicPostTeaser, type PublicPostSummary } from "../../lib/content/public-post.ts";
import type { BlogPostRecord, ProjectSummary } from "../../lib/content/types.ts";

export type PublicBlogPostSummary = PublicPostSummary;

export type PublicBlogPost = ReturnType<typeof mapPublicPostTeaser> & {
  content: string;
  description: string;
  relatedProject: {
    slug: string;
    summary: string;
    title: string;
  } | null;
};

type PublicBlogDataService = {
  getPublicProjectById: (id: string) => Promise<ProjectSummary | null>;
  getPublicPostBySlug: (slug: string) => Promise<BlogPostRecord | null>;
  listPublicPosts: () => Promise<BlogPostRecord[]>;
};

export function mapPublicBlogPostSummary(post: BlogPostRecord): PublicBlogPostSummary {
  return mapPublicPostSummary(post);
}

export function mapPublicBlogPost(post: BlogPostRecord): PublicBlogPost {
  return {
    ...mapPublicPostTeaser(post),
    content: post.contentMarkdown,
    relatedProject: null,
  };
}

async function getRelatedProject(input: {
  post: BlogPostRecord;
  service: Pick<PublicBlogDataService, "getPublicProjectById">;
}) {
  if (!input.post.relatedProjectId) {
    return null;
  }

  const project = await input.service.getPublicProjectById(input.post.relatedProjectId);

  return project
    ? {
        slug: project.slug,
        summary: project.summary,
        title: project.title,
      }
    : null;
}

// 文章列表（文章分頁，SPEC-004）：全部已上架文章，依既有排序；每篇有完整日期、標題與整理過的摘要（沒有摘要時為 null）。
// 另外回傳兩個分頁的數量。
export async function loadBlogIndexPageData(input: {
  service: Pick<PublicBlogDataService, "listPublicPosts"> & { listPublicProjects: () => Promise<unknown[]> };
}) {
  const [posts, projects] = await Promise.all([input.service.listPublicPosts(), input.service.listPublicProjects()]);

  return {
    counts: { cases: projects.length, posts: posts.length },
    posts: posts.map((post) => {
      const summary = mapPublicBlogPostSummary(post);

      return { date: summary.date, excerpt: normalizeExcerpt(post.excerpt), slug: summary.slug, title: summary.title };
    }),
  };
}

export async function loadBlogPostPageData(input: {
  service: Pick<PublicBlogDataService, "getPublicProjectById" | "getPublicPostBySlug">;
  slug: string;
}) {
  const post = await input.service.getPublicPostBySlug(input.slug);

  if (!post) {
    return null;
  }

  return {
    ...mapPublicBlogPost(post),
    relatedProject: await getRelatedProject({
      post,
      service: input.service,
    }),
  };
}
