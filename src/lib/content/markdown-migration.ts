import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

import type { BlogPostRecord, CreateBlogPostInput } from "./types.ts";

type MigrationService = {
  createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
  listAdminPosts: () => Promise<BlogPostRecord[]>;
};

export type MarkdownImportResult = {
  created: string[];
  skipped: string[];
};

function getStringValue(rawData: Record<string, unknown>, key: string): string | null {
  const value = rawData[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getPublishedAt(rawDate: string | null, isDraft: boolean): string | null {
  if (isDraft || !rawDate) {
    return null;
  }

  return new Date(`${rawDate}T00:00:00.000Z`).toISOString();
}

async function listMarkdownFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  });

  return entries.filter((entry) => entry.endsWith(".md")).sort((a, b) => a.localeCompare(b));
}

export async function loadMarkdownPostInputs(directory = path.join(process.cwd(), "content/posts")): Promise<CreateBlogPostInput[]> {
  const fileNames = await listMarkdownFiles(directory);
  const posts = await Promise.all(
    fileNames.map(async (fileName) => {
      const fullPath = path.join(directory, fileName);
      const fileContents = await fs.readFile(fullPath, "utf8");
      const { content, data } = matter(fileContents);
      const rawData = data as Record<string, unknown>;
      const slug = fileName.replace(/\.md$/, "");
      const isDraft = Boolean(rawData.draft);

      return {
        contentMarkdown: content.trim(),
        excerpt: null,
        publishedAt: getPublishedAt(getStringValue(rawData, "date"), isDraft),
        relatedProjectId: null,
        slug,
        status: isDraft ? "draft" : "published",
        title: getStringValue(rawData, "title") ?? slug,
      } satisfies CreateBlogPostInput;
    }),
  );

  return posts;
}

export async function importMarkdownPosts(input: {
  posts: CreateBlogPostInput[];
  service: MigrationService;
}): Promise<MarkdownImportResult> {
  const existingPosts = await input.service.listAdminPosts();
  const existingSlugs = new Set(existingPosts.map((post) => post.slug));
  const result: MarkdownImportResult = {
    created: [],
    skipped: [],
  };

  for (const post of input.posts) {
    if (existingSlugs.has(post.slug)) {
      result.skipped.push(post.slug);
      continue;
    }

    await input.service.createPost(post);
    existingSlugs.add(post.slug);
    result.created.push(post.slug);
  }

  return result;
}
