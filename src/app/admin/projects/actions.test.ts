import assert from "node:assert/strict";
import test from "node:test";

type AdminProjectFormState = {
  error: string | null;
};

type ProjectRecord = {
  contentMarkdown: string | null;
  createdAt: string;
  featured: boolean;
  id: string;
  outcomes: string[];
  period: string | null;
  publishedAt: string | null;
  role: string | null;
  slug: string;
  status: "draft" | "published";
  summary: string | null;
  tags: string[];
  title: string;
  updatedAt: string;
};

type CreateProjectInput = {
  contentMarkdown?: string | null;
  featured?: boolean;
  outcomes?: string[];
  period?: string | null;
  role?: string | null;
  slug: string;
  status?: "draft" | "published";
  summary?: string | null;
  tags?: string[];
  title: string;
};

type UpdateProjectInput = Partial<CreateProjectInput>;

function createProject(overrides?: Partial<ProjectRecord>): ProjectRecord {
  return {
    contentMarkdown: null,
    createdAt: "2026-06-09T00:00:00.000Z",
    featured: false,
    id: "project-1",
    outcomes: [],
    period: null,
    publishedAt: null,
    role: null,
    slug: "sample-project",
    status: "draft",
    summary: "Project summary",
    tags: [],
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

function createFormData(entries: Array<[string, string]>): FormData {
  const formData = new FormData();

  for (const [key, value] of entries) {
    formData.set(key, value);
  }

  return formData;
}

test("createAdminProjectAction creates a project with public content fields and redirects to the edit page", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string) => void;
      service: {
        createProject: (input: CreateProjectInput) => Promise<ProjectRecord>;
        updateProject: (id: string, input: UpdateProjectInput) => Promise<ProjectRecord>;
      };
    }) => {
      createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
      updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
    };
    initialAdminProjectFormState: AdminProjectFormState;
  }>("./action-core.ts", "admin projects actions");

  const createCalls: CreateProjectInput[] = [];
  const revalidatedPaths: string[] = [];
  const redirects: string[] = [];

  const actions = actionsModule.createAdminProjectMutationActions({
    redirectTo: (path) => {
      redirects.push(path);
      throw new Error(`redirect:${path}`);
    },
    revalidatePath: (path) => {
      revalidatedPaths.push(path);
    },
    service: {
      createProject: async (input) => {
        createCalls.push(input);
        return createProject({ id: "created-project", ...input });
      },
      updateProject: async () => {
        throw new Error("updateProject should not be called during create");
      },
    },
  });

  const formData = createFormData([
    ["title", "  New project  "],
    ["slug", "  new-project  "],
    ["summary", " New summary "],
    ["role", " Product lead "],
    ["period", " 2025 "],
    ["tags", "AI workflow, Product strategy, , "],
    ["outcomes", " Outcome one \nOutcome two \n  "],
    ["contentMarkdown", "  # Project body  "],
    ["featured", "on"],
    ["status", "published"],
  ]);

  await assert.rejects(
    () => actions.createProject(actionsModule.initialAdminProjectFormState, formData),
    /redirect:\/admin\/projects\/created-project/,
  );

  assert.deepEqual(createCalls, [
    {
      contentMarkdown: "# Project body",
      featured: true,
      outcomes: ["Outcome one", "Outcome two"],
      period: "2025",
      role: "Product lead",
      slug: "new-project",
      status: "published",
      summary: "New summary",
      tags: ["AI workflow", "Product strategy"],
      title: "New project",
    },
  ]);
  assert.deepEqual(revalidatedPaths, ["/admin/projects", "/admin/projects/created-project"]);
  assert.deepEqual(redirects, ["/admin/projects/created-project"]);
});

test("updateAdminProjectAction updates an existing project with public content fields and redirects back to the edit page", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string) => void;
      service: {
        createProject: (input: CreateProjectInput) => Promise<ProjectRecord>;
        updateProject: (id: string, input: UpdateProjectInput) => Promise<ProjectRecord>;
      };
    }) => {
      updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
    };
    initialAdminProjectFormState: AdminProjectFormState;
  }>("./action-core.ts", "admin projects actions");

  const updateCalls: Array<{ id: string; input: UpdateProjectInput }> = [];
  const revalidatedPaths: string[] = [];
  const redirects: string[] = [];

  const actions = actionsModule.createAdminProjectMutationActions({
    redirectTo: (path) => {
      redirects.push(path);
      throw new Error(`redirect:${path}`);
    },
    revalidatePath: (path) => {
      revalidatedPaths.push(path);
    },
    service: {
      createProject: async () => {
        throw new Error("createProject should not be called during update");
      },
      updateProject: async (id, input) => {
        updateCalls.push({ id, input });
        return createProject({ id, ...input });
      },
    },
  });

  const formData = createFormData([
    ["id", "project-9"],
    ["title", "  Updated project  "],
    ["slug", " updated-project "],
    ["summary", "Updated summary"],
    ["role", " Staff PM "],
    ["period", " 2026 "],
    ["tags", "Growth, CRM"],
    ["outcomes", " First outcome \nSecond outcome "],
    ["contentMarkdown", " Updated body "],
    ["status", "draft"],
  ]);

  await assert.rejects(
    () => actions.updateProject(actionsModule.initialAdminProjectFormState, formData),
    /redirect:\/admin\/projects\/project-9/,
  );

  assert.deepEqual(updateCalls, [
    {
      id: "project-9",
      input: {
        contentMarkdown: "Updated body",
        featured: false,
        outcomes: ["First outcome", "Second outcome"],
        period: "2026",
        role: "Staff PM",
        slug: "updated-project",
        status: "draft",
        summary: "Updated summary",
        tags: ["Growth", "CRM"],
        title: "Updated project",
      },
    },
  ]);
  assert.deepEqual(revalidatedPaths, ["/admin/projects", "/admin/projects/project-9"]);
  assert.deepEqual(redirects, ["/admin/projects/project-9"]);
});

test("createAdminProjectAction returns a controlled error when the slug already exists", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string) => void;
      service: {
        createProject: (input: CreateProjectInput) => Promise<ProjectRecord>;
        updateProject: (id: string, input: UpdateProjectInput) => Promise<ProjectRecord>;
      };
    }) => {
      createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
    };
    initialAdminProjectFormState: AdminProjectFormState;
  }>("./action-core.ts", "admin projects actions");

  const actions = actionsModule.createAdminProjectMutationActions({
    redirectTo: (path) => {
      throw new Error(`unexpected redirect:${path}`);
    },
    revalidatePath: () => {},
    service: {
      createProject: async () => {
        throw new Error("這個 slug 已經被其他專案使用，請換一個網址識別字。");
      },
      updateProject: async () => {
        throw new Error("updateProject should not be called during create");
      },
    },
  });

  const result = await actions.createProject(
    actionsModule.initialAdminProjectFormState,
    createFormData([
      ["title", "New project"],
      ["slug", "duplicate-project"],
      ["summary", ""],
      ["status", "published"],
    ]),
  );

  assert.deepEqual(result, {
    error: "這個 slug 已經被其他專案使用，請換一個網址識別字。",
  });
});

test("updateAdminProjectAction returns a controlled error when the project is missing", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string) => void;
      service: {
        createProject: (input: CreateProjectInput) => Promise<ProjectRecord>;
        updateProject: (id: string, input: UpdateProjectInput) => Promise<ProjectRecord>;
      };
    }) => {
      updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
    };
    initialAdminProjectFormState: AdminProjectFormState;
  }>("./action-core.ts", "admin projects actions");

  const actions = actionsModule.createAdminProjectMutationActions({
    redirectTo: (path) => {
      throw new Error(`unexpected redirect:${path}`);
    },
    revalidatePath: () => {},
    service: {
      createProject: async () => {
        throw new Error("createProject should not be called during update");
      },
      updateProject: async () => {
        const serviceModule = await import("../../../lib/content/service.ts");
        throw new serviceModule.ProjectNotFoundError("missing-project");
      },
    },
  });

  const result = await actions.updateProject(
    actionsModule.initialAdminProjectFormState,
    createFormData([
      ["id", "missing-project"],
      ["title", "Missing project"],
      ["slug", "missing-project"],
      ["summary", ""],
      ["status", "draft"],
    ]),
  );

  assert.deepEqual(result, {
    error: "找不到指定專案。",
  });
});

test("createAdminProjectAction returns a controlled error when the admin session is no longer allowed", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectServerActions: (input: {
      getActions: () => Promise<{
        createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
        updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
      }>;
    }) => {
      createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
      updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
    };
    initialAdminProjectFormState: AdminProjectFormState;
  }>("./action-core.ts", "admin projects actions");

  const guardsModule = await import("../../../lib/auth/guards.ts");
  const actions = actionsModule.createAdminProjectServerActions({
    getActions: async () => {
      throw new guardsModule.AdminAuthorizationError("unauthenticated");
    },
  });

  const result = await actions.createProject(
    actionsModule.initialAdminProjectFormState,
    createFormData([
      ["title", "Draft project"],
      ["slug", "draft-project"],
      ["summary", ""],
      ["status", "draft"],
    ]),
  );

  assert.deepEqual(result, {
    error: "登入狀態已失效，請重新登入。",
  });
});
