import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

import type { ProjectRecord, SyncProjectInput } from "./types.ts";

type ProjectSyncService = {
  listAdminProjects: () => Promise<ProjectRecord[]>;
  upsertProject: (input: SyncProjectInput) => Promise<ProjectRecord>;
};

export type ProjectSyncResult = {
  created: string[];
  skipped: string[];
  updated: string[];
};

async function listMarkdownFiles(directory: string): Promise<string[]> {
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

function normalizeProjectInput(input: SyncProjectInput) {
  return {
    contentMarkdown: input.contentMarkdown ?? null,
    publishedAt: input.publishedAt ?? null,
    slug: input.slug,
    status: input.status,
    summary: input.summary ?? null,
    title: input.title,
  };
}

function matchesExistingProject(existingProject: ProjectRecord, input: SyncProjectInput) {
  const normalizedInput = normalizeProjectInput(input);

  return (
    existingProject.contentMarkdown === normalizedInput.contentMarkdown &&
    existingProject.publishedAt === normalizedInput.publishedAt &&
    existingProject.slug === normalizedInput.slug &&
    existingProject.status === normalizedInput.status &&
    existingProject.summary === normalizedInput.summary &&
    existingProject.title === normalizedInput.title
  );
}

export async function loadMarkdownProjectInputs(directory = path.join(process.cwd(), "content/projects")): Promise<SyncProjectInput[]> {
  const fileNames = await listMarkdownFiles(directory);

  return Promise.all(
    fileNames.map(async (fileName) => {
      const fullPath = path.join(directory, fileName);
      const fileContents = await fs.readFile(fullPath, "utf8");
      const { content, data } = matter(fileContents);
      const rawData = data as Record<string, unknown>;
      const slugFromFile = fileName.replace(/\.md$/, "");
      const slug = getStringValue(rawData, "slug") ?? slugFromFile;
      const title = getStringValue(rawData, "title") ?? slug;
      const summary = getStringValue(rawData, "summary");
      const isDraft = Boolean(rawData.draft);

      return {
        contentMarkdown: content.trim(),
        publishedAt: null,
        slug,
        status: isDraft ? "draft" : "published",
        summary,
        title,
      } satisfies SyncProjectInput;
    }),
  );
}

export async function syncMarkdownProjects(input: {
  projects: SyncProjectInput[];
  service: ProjectSyncService;
}): Promise<ProjectSyncResult> {
  const existingProjects = await input.service.listAdminProjects();
  const existingProjectsBySlug = new Map(existingProjects.map((project) => [project.slug, project]));
  const result: ProjectSyncResult = {
    created: [],
    skipped: [],
    updated: [],
  };

  for (const project of input.projects) {
    const existingProject = existingProjectsBySlug.get(project.slug);

    if (!existingProject) {
      const syncedProject = await input.service.upsertProject(project);
      existingProjectsBySlug.set(project.slug, syncedProject);
      result.created.push(project.slug);
      continue;
    }

    if (matchesExistingProject(existingProject, project)) {
      result.skipped.push(project.slug);
      continue;
    }

    const syncedProject = await input.service.upsertProject(project);
    existingProjectsBySlug.set(project.slug, syncedProject);
    result.updated.push(project.slug);
  }

  return result;
}
