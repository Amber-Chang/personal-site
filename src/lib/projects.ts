// [AI-ASSISTED] Generated with Codex, 2026-05-18
// 功能：讀取 content/projects/ 的 Markdown 案例，提供列表、精選與單篇查詢。

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const projectsDirectory = path.join(process.cwd(), "content/projects");

export type ProjectMeta = {
  title: string;
  slug: string;
  summary: string;
  role: string;
  period: string;
  tags: string[];
  outcomes: string[];
  featured: boolean;
  draft: boolean;
};

export type Project = ProjectMeta & {
  content: string;
};

function normalizeProjectMeta(fileName: string, rawData: Record<string, unknown>): ProjectMeta {
  const slugFromFile = fileName.replace(/\.md$/, "");

  return {
    title: typeof rawData.title === "string" ? rawData.title : slugFromFile,
    slug: typeof rawData.slug === "string" ? rawData.slug : slugFromFile,
    summary: typeof rawData.summary === "string" ? rawData.summary : "",
    role: typeof rawData.role === "string" ? rawData.role : "",
    period: typeof rawData.period === "string" ? rawData.period : "",
    tags: Array.isArray(rawData.tags)
      ? rawData.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    outcomes: Array.isArray(rawData.outcomes)
      ? rawData.outcomes.filter((item): item is string => typeof item === "string")
      : [],
    featured: Boolean(rawData.featured),
    draft: Boolean(rawData.draft),
  };
}

export function getPublishedProjects(): ProjectMeta[] {
  if (!fs.existsSync(projectsDirectory)) {
    return [];
  }

  return fs
    .readdirSync(projectsDirectory)
    .filter((name) => name.endsWith(".md"))
    .map((fileName) => {
      const fullPath = path.join(projectsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data } = matter(fileContents);

      return normalizeProjectMeta(fileName, data as Record<string, unknown>);
    })
    .filter((project) => !project.draft)
    .sort((a, b) => a.title.localeCompare(b.title, "zh-Hant"));
}

export function getFeaturedProjects(): ProjectMeta[] {
  return getPublishedProjects().filter((project) => project.featured);
}

export function getProjectBySlug(slug: string): Project | null {
  const fullPath = path.join(projectsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const meta = normalizeProjectMeta(`${slug}.md`, data as Record<string, unknown>);

  return {
    ...meta,
    content,
  };
}
