import assert from "node:assert/strict";
import test from "node:test";

type ProjectSummary = {
  featured: boolean;
  id: string;
  outcomes: string[];
  period: string;
  projectType: "work" | "research" | "side" | null;
  role: string;
  slug: string;
  summary: string;
  tags: string[];
  title: string;
};

function createProject(index: number, overrides?: Partial<ProjectSummary>): ProjectSummary {
  return {
    featured: index === 1,
    id: `project-${index}`,
    outcomes: [`Outcome ${index}`],
    period: `202${index}`,
    projectType: index === 1 ? "work" : null,
    role: "PM",
    slug: `project-${index}`,
    summary: `Summary ${index}`,
    tags: [`Tag ${index}`],
    title: `Project ${index}`,
    ...overrides,
  };
}

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("loadProjectsPageData lists published projects through the public content service", async () => {
  const dataModule = await loadModule<{
    loadProjectsPageData: (input: {
      service: {
        listPublicProjects: () => Promise<ProjectSummary[]>;
      };
    }) => Promise<{ projects: Array<{ slug: string; summary: string; title: string; typeLabel: string | null }> }>;
  }>("./data.ts", "projects list data");

  const calls: string[] = [];
  const projects = [createProject(1), createProject(2)];

  const result = await dataModule.loadProjectsPageData({
    service: {
      listPublicProjects: async () => {
        calls.push("listPublicProjects");
        return projects;
      },
    },
  });

  assert.deepEqual(calls, ["listPublicProjects"]);
  // 列表卡片只帶標題、摘要與類型標籤；不認得的類型不顯示標籤。
  assert.deepEqual(result, {
    projects: [
      { firstOutcome: null, role: null, slug: "project-1", summary: "Summary 1", title: "Project 1", typeLabel: "工作案例" },
      { firstOutcome: null, role: null, slug: "project-2", summary: "Summary 2", title: "Project 2", typeLabel: null },
    ],
  });
});
