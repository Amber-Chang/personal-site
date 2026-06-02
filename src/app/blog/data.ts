import type { BlogPostRecord } from "../../lib/content/types.ts";

export type PublicBlogPostSummary = {
  date: string;
  slug: string;
  tags: string[];
  title: string;
};

export type PublicBlogPost = PublicBlogPostSummary & {
  content: string;
  description: string;
};

type PublicBlogDataService = {
  getPublicPostBySlug: (slug: string) => Promise<BlogPostRecord | null>;
  listPublicPosts: () => Promise<BlogPostRecord[]>;
};

function getPublicDate(post: BlogPostRecord): string {
  return post.publishedAt ?? post.updatedAt;
}

function getDescription(post: BlogPostRecord): string {
  return (post.excerpt?.trim() || post.contentMarkdown.slice(0, 160)).replace(/\s+/g, " ").trim();
}

export function mapPublicBlogPostSummary(post: BlogPostRecord): PublicBlogPostSummary {
  return {
    date: getPublicDate(post),
    slug: post.slug,
    tags: [],
    title: post.title,
  };
}

export function mapPublicBlogPost(post: BlogPostRecord): PublicBlogPost {
  return {
    ...mapPublicBlogPostSummary(post),
    content: post.contentMarkdown,
    description: getDescription(post),
  };
}

export async function loadBlogIndexPageData(input: {
  service: Pick<PublicBlogDataService, "listPublicPosts">;
}) {
  const posts = await input.service.listPublicPosts();

  return {
    posts: posts.map(mapPublicBlogPostSummary),
  };
}

export async function loadBlogPostPageData(input: {
  service: Pick<PublicBlogDataService, "getPublicPostBySlug">;
  slug: string;
}) {
  const post = await input.service.getPublicPostBySlug(input.slug);

  return post ? mapPublicBlogPost(post) : null;
}
