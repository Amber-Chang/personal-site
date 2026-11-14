import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type { ProjectRecord, SyncProjectInput } from "./types.ts";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

function createTempProjectsDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "markdown-projects-"));
}

function createProjectRecord(input: SyncProjectInput, overrides?: Partial<ProjectRecord>): ProjectRecord {
  return {
    contentMarkdown: input.contentMarkdown ?? null,
    createdAt: "2026-06-09T00:00:00.000Z",
    featured: input.featured ?? false,
    id: overrides?.id ?? `project-${input.slug}`,
    outcomes: input.outcomes ?? [],
    period: input.period ?? null,
    projectType: input.projectType,
    publishedAt: input.publishedAt ?? null,
    role: input.role ?? null,
    slug: input.slug,
    status: input.status,
    summary: input.summary ?? null,
    tags: input.tags ?? [],
    title: input.title,
    updatedAt: "2026-06-09T00:00:00.000Z",
    ...overrides,
  };
}

test("loadMarkdownProjectInputs maps markdown files to sync project inputs", async () => {
  const migrationModule = await loadModule<{
    loadMarkdownProjectInputs: (directory: string) => Promise<SyncProjectInput[]>;
  }>("./project-migration.ts", "project migration");

  const projectsDirectory = createTempProjectsDirectory();
  fs.writeFileSync(
    path.join(projectsDirectory, "published-project.md"),
    [
      "---",
      'title: "Published Project"',
      'summary: "Published summary"',
      'role: "PM"',
      'period: "2025"',
      "type: work",
      "tags:",
      "  - Strategy",
      "  - Workflow",
      "outcomes:",
      "  - Outcome A",
      "  - Outcome B",
      "featured: true",
      "draft: false",
      "---",
      "",
      "Published body",
    ].join("\n"),
  );
  fs.writeFileSync(
    path.join(projectsDirectory, "draft-project.md"),
    [
      "---",
      'title: "Draft Project"',
      'summary: "Draft summary"',
      "type: research",
      "draft: true",
      "---",
      "",
      "Draft body",
    ].join("\n"),
  );
  fs.writeFileSync(path.join(projectsDirectory, "notes.txt"), "ignore me");

  const inputs = await migrationModule.loadMarkdownProjectInputs(projectsDirectory);

  assert.deepEqual(inputs, [
    {
      contentMarkdown: "Draft body",
      featured: false,
      outcomes: [],
      period: null,
      projectType: "research",
      publishedAt: null,
      role: null,
      slug: "draft-project",
      status: "draft",
      summary: "Draft summary",
      tags: [],
      title: "Draft Project",
    },
    {
      contentMarkdown: "Published body",
      featured: true,
      outcomes: ["Outcome A", "Outcome B"],
      period: "2025",
      projectType: "work",
      publishedAt: null,
      role: "PM",
      slug: "published-project",
      status: "published",
      summary: "Published summary",
      tags: ["Strategy", "Workflow"],
      title: "Published Project",
    },
  ]);
});

test("package scripts expose the markdown project sync command", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts?.["content:sync-projects"],
    "node --no-warnings --experimental-strip-types scripts/sync-markdown-projects.ts",
  );
});

test("syncMarkdownProjects creates, updates, and skips project identities by slug", async () => {
  const migrationModule = await loadModule<{
    syncMarkdownProjects: (input: {
      projects: SyncProjectInput[];
      service: {
        listAdminProjects: () => Promise<ProjectRecord[]>;
        upsertProject: (input: SyncProjectInput) => Promise<ProjectRecord>;
      };
    }) => Promise<{
      created: string[];
      skipped: string[];
      updated: string[];
    }>;
  }>("./project-migration.ts", "project migration");

  const upsertCalls: SyncProjectInput[] = [];

  const result = await migrationModule.syncMarkdownProjects({
    projects: [
      {
        contentMarkdown: "Existing body",
        featured: false,
        outcomes: [],
        period: null,
        projectType: "side",
        publishedAt: null,
        role: null,
        slug: "already-synced",
        status: "published",
        summary: "Same summary",
        tags: [],
        title: "Already synced",
      },
      {
        contentMarkdown: "Updated body",
        featured: false,
        outcomes: [],
        period: null,
        projectType: "side",
        publishedAt: null,
        role: null,
        slug: "needs-update",
        status: "published",
        summary: "Updated summary",
        tags: [],
        title: "Needs update",
      },
      {
        contentMarkdown: "New body",
        featured: false,
        outcomes: [],
        period: null,
        projectType: "side",
        publishedAt: null,
        role: null,
        slug: "new-project",
        status: "published",
        summary: "New summary",
        tags: [],
        title: "New project",
      },
    ],
    service: {
      listAdminProjects: async () => [
        createProjectRecord({
          contentMarkdown: "Existing body",
          featured: false,
          outcomes: [],
          period: null,
          projectType: "side",
          publishedAt: null,
          role: null,
          slug: "already-synced",
          status: "published",
          summary: "Same summary",
          tags: [],
          title: "Already synced",
        }),
        createProjectRecord({
          contentMarkdown: "Old body",
          featured: false,
          outcomes: [],
          period: null,
          projectType: "side",
          publishedAt: null,
          role: null,
          slug: "needs-update",
          status: "draft",
          summary: "Old summary",
          tags: [],
          title: "Needs update",
        }),
      ],
      upsertProject: async (input) => {
        upsertCalls.push(input);

        return createProjectRecord(input);
      },
    },
  });

  assert.deepEqual(upsertCalls, [
    {
      contentMarkdown: "Updated body",
      featured: false,
      outcomes: [],
      period: null,
      projectType: "side",
      publishedAt: null,
      role: null,
      slug: "needs-update",
      status: "published",
      summary: "Updated summary",
      tags: [],
      title: "Needs update",
    },
    {
      contentMarkdown: "New body",
      featured: false,
      outcomes: [],
      period: null,
      projectType: "side",
      publishedAt: null,
      role: null,
      slug: "new-project",
      status: "published",
      summary: "New summary",
      tags: [],
      title: "New project",
    },
  ]);
  assert.deepEqual(result, {
    created: ["new-project"],
    skipped: ["already-synced"],
    updated: ["needs-update"],
  });
});

test("loadMarkdownProjectInputs stops with the file name when type is missing or unknown", async () => {
  const migrationModule = await loadModule<{
    loadMarkdownProjectInputs: (directory: string) => Promise<SyncProjectInput[]>;
  }>("./project-migration.ts", "project migration");

  for (const typeLine of [null, "type: personal"]) {
    const projectsDirectory = createTempProjectsDirectory();
    fs.writeFileSync(
      path.join(projectsDirectory, "untyped-project.md"),
      ["---", 'title: "Untyped"', ...(typeLine ? [typeLine] : []), "---", "", "Body"].join("\n"),
    );

    await assert.rejects(
      () => migrationModule.loadMarkdownProjectInputs(projectsDirectory),
      /untyped-project\.md.*type.*work.*research.*side/s,
    );
  }
});

test("syncMarkdownProjects updates a project whose only difference is its type", async () => {
  const migrationModule = await loadModule<{
    syncMarkdownProjects: (input: {
      projects: SyncProjectInput[];
      service: {
        listAdminProjects: () => Promise<ProjectRecord[]>;
        upsertProject: (input: SyncProjectInput) => Promise<ProjectRecord>;
      };
    }) => Promise<{ created: string[]; skipped: string[]; updated: string[] }>;
  }>("./project-migration.ts", "project migration");

  const project: SyncProjectInput = {
    contentMarkdown: "Body",
    projectType: "work",
    slug: "retyped",
    status: "published",
    title: "Retyped",
  };

  const result = await migrationModule.syncMarkdownProjects({
    projects: [project],
    service: {
      listAdminProjects: async () => [createProjectRecord({ ...project, projectType: "side" })],
      upsertProject: async (input) => createProjectRecord(input),
    },
  });

  assert.deepEqual(result, { created: [], skipped: [], updated: ["retyped"] });
});
