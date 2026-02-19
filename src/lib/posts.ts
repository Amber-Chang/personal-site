// [AI-ASSISTED] Generated with Codex, 2026-02-19
// 功能：讀取 content/posts/ 的 Markdown 文章，提供列表、精選與單篇查詢。

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const postsDirectory = path.join(process.cwd(), "content/posts");

export type PostMeta = {
  title: string;
  date: string;
  slug: string;
  tags: string[];
  featured: boolean;
};

export type Post = PostMeta & {
  content: string;
};

function normalizePostMeta(fileName: string, rawData: Record<string, unknown>): PostMeta {
  const slugFromFile = fileName.replace(/\.md$/, "");

  return {
    title: typeof rawData.title === "string" ? rawData.title : slugFromFile,
    date: typeof rawData.date === "string" ? rawData.date : "1970-01-01",
    slug: slugFromFile,
    tags: Array.isArray(rawData.tags)
      ? rawData.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    featured: Boolean(rawData.featured),
  };
}

export function getPublishedPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(postsDirectory)
    .filter((name) => name.endsWith(".md"))
    .map((fileName) => {
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      return normalizePostMeta(fileName, data as Record<string, unknown>);
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFeaturedPosts(): PostMeta[] {
  return getPublishedPosts().filter((post) => post.featured);
}

export function getPostBySlug(slug: string): Post | null {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const meta = normalizePostMeta(`${slug}.md`, data as Record<string, unknown>);

  return {
    ...meta,
    content,
  };
}
