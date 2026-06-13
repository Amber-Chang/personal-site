import assert from "node:assert/strict";
import test from "node:test";

type ProjectRecord = {
  contentMarkdown: string | null;
  createdAt: string;
  id: string;
  publishedAt: string | null;
  sortOrder: number;
  slug: string;
  status: "draft" | "published";
  summary: string | null;
  title: string;
  updatedAt: string;
};

function createProject(overrides?: Partial<ProjectRecord>): ProjectRecord {
  return {
    contentMarkdown: null,
    createdAt: "2026-06-09T00:00:00.000Z",
    id: "project-1",
    publishedAt: null,
    sortOrder: 1,
    slug: "sample-project",
    status: "draft",
    summary: "Project summary",
    title: "Sample project",
    updatedAt: "2026-06-09T00:00:00.000Z",
    ...overrides,
  };
}

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("loadAdminProjectsPageData lists projects through the admin content path", async () => {
  const dataModule = await loadModule<{
    loadAdminProjectsPageData: (input: {
      service: {
        listAdminProjects: () => Promise<ProjectRecord[]>;
      };
    }) => Promise<{ projects: ProjectRecord[] }>;
  }>("./data.ts", "admin projects data");

  const calls: string[] = [];
  const projects = [createProject()];

  const result = await dataModule.loadAdminProjectsPageData({
    service: {
      listAdminProjects: async () => {
        calls.push("listAdminProjects");
        return projects;
      },
    },
  });

  assert.deepEqual(calls, ["listAdminProjects"]);
  assert.deepEqual(result, { projects });
});

test("loadAdminProjectsPageData preserves sortOrder for admin ordering UI", async () => {
  const dataModule = await loadModule<{
    loadAdminProjectsPageData: (input: {
      service: {
        listAdminProjects: () => Promise<ProjectRecord[]>;
      };
    }) => Promise<{ projects: ProjectRecord[] }>;
  }>("./data.ts", "admin projects data");

  const projects = [createProject({ id: "project-2", sortOrder: 9 })];

  const result = await dataModule.loadAdminProjectsPageData({
    service: {
      listAdminProjects: async () => projects,
    },
  });

  assert.equal(result.projects[0]?.sortOrder, 9);
});

test("loadAdminProjectEditPageData returns null when the project does not exist", async () => {
  const dataModule = await loadModule<{
    loadAdminProjectEditPageData: (input: {
      id: string;
      service: {
        getAdminProjectById: (id: string) => Promise<ProjectRecord | null>;
      };
    }) => Promise<{ project: ProjectRecord } | null>;
  }>("./data.ts", "admin projects data");

  const calls: Array<{ method: string; value: string }> = [];

  const result = await dataModule.loadAdminProjectEditPageData({
    id: "missing-project",
    service: {
      getAdminProjectById: async (id) => {
        calls.push({ method: "getAdminProjectById", value: id });
        return null;
      },
    },
  });

  assert.equal(result, null);
  assert.deepEqual(calls, [{ method: "getAdminProjectById", value: "missing-project" }]);
});

test("loadAdminProjectEditPageData returns the editable project identity", async () => {
  const dataModule = await loadModule<{
    loadAdminProjectEditPageData: (input: {
      id: string;
      service: {
        getAdminProjectById: (id: string) => Promise<ProjectRecord | null>;
      };
    }) => Promise<{ project: ProjectRecord } | null>;
  }>("./data.ts", "admin projects data");

  const project = createProject({
    id: "project-2",
    slug: "sms-management-platform",
    status: "published",
  });

  const result = await dataModule.loadAdminProjectEditPageData({
    id: "project-2",
    service: {
      getAdminProjectById: async () => project,
    },
  });

  assert.deepEqual(result, { project });
});

test("loadAdminProjectEditPageData preserves project status for delete UI decisions", async () => {
  const dataModule = await loadModule<{
    loadAdminProjectEditPageData: (input: {
      id: string;
      service: {
        getAdminProjectById: (id: string) => Promise<ProjectRecord | null>;
      };
    }) => Promise<{ project: ProjectRecord } | null>;
  }>("./data.ts", "admin projects data");

  const result = await dataModule.loadAdminProjectEditPageData({
    id: "project-3",
    service: {
      getAdminProjectById: async (id) =>
        createProject({
          id,
          publishedAt: "2026-06-09T12:00:00.000Z",
          status: "published",
        }),
    },
  });

  assert.equal(result?.project.status, "published");
});
