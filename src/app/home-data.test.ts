import assert from "node:assert/strict";
import test from "node:test";

import type { BlogPostRecord, ProjectSummary } from "../lib/content/types.ts";

type HomeDataModule = {
  loadHomePageData: (input: {
    service: {
      listPublicPosts: () => Promise<BlogPostRecord[]>;
      listPublicProjects: () => Promise<ProjectSummary[]>;
    };
  }) => Promise<{
    counts: { cases: number; posts: number };
    projects: Array<{ slug: string; title: string; typeLabel: string | null }>;
  }>;
  orderHomeProjects: <T extends { featured: boolean }>(projects: T[]) => T[];
};

async function loadModule(): Promise<HomeDataModule> {
  const loadedModule = await import("./home-data.ts").catch(() => null);

  assert.ok(loadedModule, "expected home data module to exist at ./home-data.ts");

  return loadedModule as HomeDataModule;
}

function createProject(slug: string, featured: boolean): ProjectSummary {
  return {
    featured,
    id: slug,
    outcomes: [],
    period: "",
    projectType: "work",
    role: "",
    slug,
    summary: `${slug} summary`,
    tags: [],
    title: slug,
  };
}

function createPost(slug: string): BlogPostRecord {
  return {
    contentMarkdown: slug,
    createdAt: "2026-06-02T00:00:00.000Z",
    excerpt: null,
    id: slug,
    publishedAt: "2026-06-02T00:00:00.000Z",
    relatedProjectId: null,
    slug,
    sortOrder: 0,
    status: "published",
    title: slug,
    updatedAt: "2026-06-02T00:00:00.000Z",
  };
}

test("orderHomeProjects puts featured projects first and keeps the existing order inside each group", async () => {
  const { orderHomeProjects } = await loadModule();
  const projects = [
    { featured: false, slug: "a" },
    { featured: true, slug: "b" },
    { featured: false, slug: "c" },
    { featured: true, slug: "d" },
  ];

  assert.deepEqual(
    orderHomeProjects(projects).map((project) => project.slug),
    ["b", "d", "a", "c"],
  );
  assert.deepEqual(orderHomeProjects([]), []);
  // 不改到傳入的陣列。
  assert.deepEqual(projects.map((project) => project.slug), ["a", "b", "c", "d"]);
});

test("loadHomePageData lists every published project, featured first, with the tab counts", async () => {
  const { loadHomePageData } = await loadModule();
  const result = await loadHomePageData({
    service: {
      listPublicPosts: async () => [createPost("p1"), createPost("p2"), createPost("p3")],
      listPublicProjects: async () => [createProject("one", false), createProject("two", true), createProject("three", false), createProject("four", false)],
    },
  });

  assert.deepEqual(result.projects.map((project) => project.slug), ["two", "one", "three", "four"]);
  assert.deepEqual(result.counts, { cases: 4, posts: 3 });
  assert.equal(result.projects[0]?.typeLabel, "工作案例");
});

test("loadHomePageData keeps working with no content and with a single project", async () => {
  const { loadHomePageData } = await loadModule();

  assert.deepEqual(
    await loadHomePageData({ service: { listPublicPosts: async () => [], listPublicProjects: async () => [] } }),
    { counts: { cases: 0, posts: 0 }, projects: [] },
  );

  const single = await loadHomePageData({
    service: { listPublicPosts: async () => [], listPublicProjects: async () => [createProject("only", false)] },
  });

  assert.deepEqual(single.counts, { cases: 1, posts: 0 });
  assert.deepEqual(single.projects.map((project) => project.slug), ["only"]);
});
