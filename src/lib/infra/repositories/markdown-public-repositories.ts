import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

import type { BlogPostRecord, ProjectSummary, PublicProjectRecord } from "../../content/types.ts";

type MarkdownPost = {
  contentMarkdown: string;
  publishedAt: string;
  slug: string;
  title: string;
};

type MarkdownProject = PublicProjectRecord;

async function listMarkdownFiles(directory: string) {
  const entries = await fs.readdir(directory).catch((error: unknown) => {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }

    throw error;
  });

  return entries.filter((entry) => entry.endsWith(".md")).sort((a, b) => a.localeCompare(b));
}

function getStringValue(rawData: Record<string, unknown>, key: string): string | null {
  const value = rawData[key];

  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getStringArrayValue(rawData: Record<string, unknown>, key: string): string[] {
  const value = rawData[key];

  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

async function resolveIsoDate(filePath: string, rawDate: string | null) {
  if (rawDate) {
    return new Date(`${rawDate}T00:00:00.000Z`).toISOString();
  }

  const stats = await fs.stat(filePath);

  return stats.mtime.toISOString();
}

async function loadPublishedMarkdownPosts(directory: string): Promise<MarkdownPost[]> {
  const fileNames = await listMarkdownFiles(directory);
  const posts = await Promise.all(
    fileNames.map(async (fileName) => {
      const fullPath = path.join(directory, fileName);
      const fileContents = await fs.readFile(fullPath, "utf8");
      const { content, data } = matter(fileContents);
      const rawData = data as Record<string, unknown>;

      if (Boolean(rawData.draft)) {
        return null;
      }

      const slug = fileName.replace(/\.md$/, "");

      return {
        contentMarkdown: content.trim(),
        publishedAt: await resolveIsoDate(fullPath, getStringValue(rawData, "date")),
        slug,
        title: getStringValue(rawData, "title") ?? slug,
      } satisfies MarkdownPost;
    }),
  );

  return posts
    .filter((post): post is MarkdownPost => post !== null)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
}

function mapMarkdownPostRecord(post: MarkdownPost): BlogPostRecord {
  return {
    contentMarkdown: post.contentMarkdown,
    createdAt: post.publishedAt,
    excerpt: null,
    id: post.slug,
    publishedAt: post.publishedAt,
    relatedProjectId: null,
    sortOrder: 2_147_483_647,
    slug: post.slug,
    status: "published",
    title: post.title,
    updatedAt: post.publishedAt,
  };
}

async function loadPublishedMarkdownProjects(directory: string): Promise<MarkdownProject[]> {
  const fileNames = await listMarkdownFiles(directory);
  const projects = await Promise.all(
    fileNames.map(async (fileName) => {
      const fullPath = path.join(directory, fileName);
      const fileContents = await fs.readFile(fullPath, "utf8");
      const { content, data } = matter(fileContents);
      const rawData = data as Record<string, unknown>;

      if (Boolean(rawData.draft)) {
        return null;
      }

      const slugFromFile = fileName.replace(/\.md$/, "");
      const slug = getStringValue(rawData, "slug") ?? slugFromFile;

      return {
        content: content.trim(),
        featured: Boolean(rawData.featured),
        id: slug,
        outcomes: getStringArrayValue(rawData, "outcomes"),
        period: getStringValue(rawData, "period") ?? "",
        role: getStringValue(rawData, "role") ?? "",
        slug,
        summary: getStringValue(rawData, "summary") ?? "",
        tags: getStringArrayValue(rawData, "tags"),
        title: getStringValue(rawData, "title") ?? slug,
      } satisfies MarkdownProject;
    }),
  );

  return projects
    .filter((project): project is MarkdownProject => project !== null)
    .sort((left, right) => left.title.localeCompare(right.title, "zh-Hant"));
}

function mapProjectSummary(project: MarkdownProject): ProjectSummary {
  return {
    featured: project.featured,
    id: project.id,
    outcomes: project.outcomes,
    period: project.period,
    role: project.role,
    slug: project.slug,
    summary: project.summary,
    tags: project.tags,
    title: project.title,
  };
}

export function createMarkdownPublicContentRepositories(input?: {
  postsDirectory?: string;
  projectsDirectory?: string;
}) {
  const postsDirectory = input?.postsDirectory ?? path.join(process.cwd(), "content/posts");
  const projectsDirectory = input?.projectsDirectory ?? path.join(process.cwd(), "content/projects");

  return {
    posts: {
      async getPublishedPostBySlug(slug: string) {
        const posts = await loadPublishedMarkdownPosts(postsDirectory);
        const post = posts.find((entry) => entry.slug === slug);

        return post ? mapMarkdownPostRecord(post) : null;
      },
      async listPublishedPosts() {
        return (await loadPublishedMarkdownPosts(postsDirectory)).map(mapMarkdownPostRecord);
      },
      async listPublishedPostsByProjectId() {
        return [];
      },
    },
    projects: {
      async getPublicProjectById(id: string) {
        const projects = await loadPublishedMarkdownProjects(projectsDirectory);
        const project = projects.find((entry) => entry.id === id);

        return project ? mapProjectSummary(project) : null;
      },
      async getPublicProjectBySlug(slug: string) {
        const projects = await loadPublishedMarkdownProjects(projectsDirectory);

        return projects.find((entry) => entry.slug === slug) ?? null;
      },
      async listFeaturedProjects() {
        return (await loadPublishedMarkdownProjects(projectsDirectory)).filter((project) => project.featured).map(mapProjectSummary);
      },
      async listPublishedProjects() {
        return (await loadPublishedMarkdownProjects(projectsDirectory)).map(mapProjectSummary);
      },
    },
  };
}
