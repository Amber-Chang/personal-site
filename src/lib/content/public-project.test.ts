import assert from "node:assert/strict";
import test from "node:test";

import type { ProjectSummary } from "./types.ts";

type PublicProjectModule = {
  mapPublicProjectCard: (project: ProjectSummary) => {
    firstOutcome: string | null;
    period: string | null;
    role: string | null;
    slug: string;
    summary: string;
    title: string;
    typeLabel: string | null;
  };
};

function createProject(overrides?: Partial<ProjectSummary>): ProjectSummary {
  return {
    featured: true,
    id: "project-1",
    outcomes: ["  上線後月均使用量提升 2000%  ", "第二條成果"],
    period: "2024 - 2025",
    projectType: "work",
    role: "Product Planner",
    slug: "ai-writing-review-product",
    summary: "把教師真實教學場景轉成 AI 工作流。",
    tags: ["AI Product"],
    title: "AI 寫作批改產品",
    ...overrides,
  };
}

async function loadPublicProjectModule(): Promise<PublicProjectModule> {
  const loadedModule = await import("./public-project.ts").catch(() => null);

  assert.ok(loadedModule, "expected public project module to exist at ./public-project.ts");

  return loadedModule as PublicProjectModule;
}

test("mapPublicProjectCard gives the case block its type, role, period, title, summary and first outcome", async () => {
  const { mapPublicProjectCard } = await loadPublicProjectModule();

  assert.deepEqual(mapPublicProjectCard(createProject()), {
    firstOutcome: "上線後月均使用量提升 2000%",
    period: "2024 - 2025",
    role: "Product Planner",
    slug: "ai-writing-review-product",
    summary: "把教師真實教學場景轉成 AI 工作流。",
    title: "AI 寫作批改產品",
    typeLabel: "工作案例",
  });
});

test("mapPublicProjectCard leaves out a blank role or period, missing outcomes and an unknown type", async () => {
  const { mapPublicProjectCard } = await loadPublicProjectModule();

  const card = mapPublicProjectCard(createProject({ outcomes: ["   "], period: "  ", projectType: null, role: "  " }));

  assert.equal(card.typeLabel, null);
  assert.equal(card.role, null);
  assert.equal(card.period, null);
  assert.equal(card.firstOutcome, null);
  assert.equal(mapPublicProjectCard(createProject({ outcomes: [] })).firstOutcome, null);
  // 期間維持後台填寫的文字，不轉換。
  assert.equal(mapPublicProjectCard(createProject({ period: "2026.01-" })).period, "2026.01-");
});
