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
    id: overrides?.id ?? `project-${input.slug}`,
    publishedAt: input.publishedAt ?? null,
    slug: input.slug,
    status: input.status,
    summary: input.summary ?? null,
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
      publishedAt: null,
      slug: "draft-project",
      status: "draft",
      summary: "Draft summary",
      title: "Draft Project",
    },
    {
      contentMarkdown: "Published body",
      publishedAt: null,
      slug: "published-project",
      status: "published",
      summary: "Published summary",
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
        publishedAt: null,
        slug: "already-synced",
        status: "published",
        summary: "Same summary",
        title: "Already synced",
      },
      {
        contentMarkdown: "Updated body",
        publishedAt: null,
        slug: "needs-update",
        status: "published",
        summary: "Updated summary",
        title: "Needs update",
      },
      {
        contentMarkdown: "New body",
        publishedAt: null,
        slug: "new-project",
        status: "published",
        summary: "New summary",
        title: "New project",
      },
    ],
    service: {
      listAdminProjects: async () => [
        createProjectRecord({
          contentMarkdown: "Existing body",
          publishedAt: null,
          slug: "already-synced",
          status: "published",
          summary: "Same summary",
          title: "Already synced",
        }),
        createProjectRecord({
          contentMarkdown: "Old body",
          publishedAt: null,
          slug: "needs-update",
          status: "draft",
          summary: "Old summary",
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
      publishedAt: null,
      slug: "needs-update",
      status: "published",
      summary: "Updated summary",
      title: "Needs update",
    },
    {
      contentMarkdown: "New body",
      publishedAt: null,
      slug: "new-project",
      status: "published",
      summary: "New summary",
      title: "New project",
    },
  ]);
  assert.deepEqual(result, {
    created: ["new-project"],
    skipped: ["already-synced"],
    updated: ["needs-update"],
  });
});
