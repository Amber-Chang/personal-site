import type { BlogPostRecord } from "./types.ts";

export type PublicPostSummary = {
  date: string;
  slug: string;
  tags: string[];
  title: string;
};

export type PublicPostTeaser = PublicPostSummary & {
  description: string;
};

function getPublicDate(post: BlogPostRecord): string {
  return post.publishedAt ?? post.updatedAt;
}

function getPublicDescription(post: BlogPostRecord): string {
  return (post.excerpt?.trim() || post.contentMarkdown.slice(0, 160)).replace(/\s+/g, " ").trim();
}

export function mapPublicPostSummary(post: BlogPostRecord): PublicPostSummary {
  return {
    date: getPublicDate(post),
    slug: post.slug,
    tags: [],
    title: post.title,
  };
}

export function mapPublicPostTeaser(post: BlogPostRecord): PublicPostTeaser {
  return {
    ...mapPublicPostSummary(post),
    description: getPublicDescription(post),
  };
}
