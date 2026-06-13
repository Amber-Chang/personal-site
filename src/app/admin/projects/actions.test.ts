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
  sortOrder: number;
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
    sortOrder: 1,
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
      revalidatePath: (path: string, type?: "layout" | "page") => void;
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
      revalidatePath: (path: string, type?: "layout" | "page") => void;
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
      revalidatePath: (path: string, type?: "layout" | "page") => void;
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
      revalidatePath: (path: string, type?: "layout" | "page") => void;
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

test("reorderAdminProjectsAction sends ids to the service and revalidates admin and public paths", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createProject: (input: CreateProjectInput) => Promise<ProjectRecord>;
        updateProject: (id: string, input: UpdateProjectInput) => Promise<ProjectRecord>;
        reorderProjects: (idsInOrder: string[]) => Promise<void>;
        deleteProject: (id: string) => Promise<void>;
      };
    }) => {
      reorderProjects: (idsInOrder: string[]) => Promise<{ error: string | null }>;
    };
  }>("./action-core.ts", "admin projects actions");

  const reorderCalls: string[][] = [];
  const revalidatedPaths: string[] = [];

  const actions = actionsModule.createAdminProjectMutationActions({
    redirectTo: (path) => {
      throw new Error(`unexpected redirect:${path}`);
    },
    revalidatePath: (path) => {
      revalidatedPaths.push(path);
    },
    service: {
      createProject: async () => {
        throw new Error("createProject should not be called during reorder");
      },
      updateProject: async () => {
        throw new Error("updateProject should not be called during reorder");
      },
      reorderProjects: async (idsInOrder) => {
        reorderCalls.push(idsInOrder);
      },
      deleteProject: async () => {
        throw new Error("deleteProject should not be called during reorder");
      },
    },
  });

  const result = await actions.reorderProjects(["project-3", "project-1", "project-2"]);

  assert.deepEqual(result, { error: null });
  assert.deepEqual(reorderCalls, [["project-3", "project-1", "project-2"]]);
  assert.deepEqual(revalidatedPaths, ["/admin/projects", "/projects", "/"]);
});

test("deleteAdminProjectAction revalidates admin and public paths then redirects back to the list", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createProject: (input: CreateProjectInput) => Promise<ProjectRecord>;
        updateProject: (id: string, input: UpdateProjectInput) => Promise<ProjectRecord>;
        reorderProjects: (idsInOrder: string[]) => Promise<void>;
        deleteProject: (id: string) => Promise<void>;
      };
    }) => {
      deleteProject: (id: string) => Promise<{ error: string | null }>;
    };
  }>("./action-core.ts", "admin projects actions");

  const deleteCalls: string[] = [];
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
        throw new Error("createProject should not be called during delete");
      },
      updateProject: async () => {
        throw new Error("updateProject should not be called during delete");
      },
      reorderProjects: async () => {
        throw new Error("reorderProjects should not be called during delete");
      },
      deleteProject: async (id) => {
        deleteCalls.push(id);
      },
    },
  });

  await assert.rejects(() => actions.deleteProject("project-2"), /redirect:\/admin\/projects/);

  assert.deepEqual(deleteCalls, ["project-2"]);
  assert.deepEqual(revalidatedPaths, ["/admin/projects", "/projects", "/"]);
  assert.deepEqual(redirects, ["/admin/projects"]);
});

test("deleteAdminProjectAction returns a controlled error when deleting a published project", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createProject: (input: CreateProjectInput) => Promise<ProjectRecord>;
        updateProject: (id: string, input: UpdateProjectInput) => Promise<ProjectRecord>;
        reorderProjects: (idsInOrder: string[]) => Promise<void>;
        deleteProject: (id: string) => Promise<void>;
      };
    }) => {
      deleteProject: (id: string) => Promise<{ error: string | null }>;
    };
  }>("./action-core.ts", "admin projects actions");

  const actions = actionsModule.createAdminProjectMutationActions({
    redirectTo: (path) => {
      throw new Error(`unexpected redirect:${path}`);
    },
    revalidatePath: () => {},
    service: {
      createProject: async () => {
        throw new Error("createProject should not be called during delete");
      },
      updateProject: async () => {
        throw new Error("updateProject should not be called during delete");
      },
      reorderProjects: async () => {
        throw new Error("reorderProjects should not be called during delete");
      },
      deleteProject: async () => {
        const serviceModule = await import("../../../lib/content/service.ts");
        throw new serviceModule.PublishedContentDeletionError("專案", "project-5");
      },
    },
  });

  const result = await actions.deleteProject("project-5");

  assert.deepEqual(result, {
    error: "已上架專案不能直接刪除，請先下架再刪除。",
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

test("deleteAdminProjectAction server wrapper returns a controlled error for async rejection", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectServerActions: (input: {
      getActions: () => Promise<{
        createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
        deleteProject: (id: string) => Promise<AdminProjectFormState>;
        reorderProjects: (idsInOrder: string[]) => Promise<AdminProjectFormState>;
        updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
      }>;
    }) => {
      createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
      deleteProject: (id: string) => Promise<AdminProjectFormState>;
      reorderProjects: (idsInOrder: string[]) => Promise<AdminProjectFormState>;
      updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
    };
  }>("./action-core.ts", "admin projects actions");

  const guardsModule = await import("../../../lib/auth/guards.ts");
  const actions = actionsModule.createAdminProjectServerActions({
    getActions: async () => ({
      createProject: async () => ({ error: null }),
      deleteProject: async () => {
        throw new guardsModule.AdminAuthorizationError("unauthenticated");
      },
      reorderProjects: async () => ({ error: null }),
      updateProject: async () => ({ error: null }),
    }),
  });

  const result = await actions.deleteProject("project-1");

  assert.deepEqual(result, {
    error: "登入狀態已失效，請重新登入。",
  });
});

test("deleteAdminProjectAction server wrapper rethrows Next redirect errors", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectServerActions: (input: {
      getActions: () => Promise<{
        createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
        deleteProject: (id: string) => Promise<AdminProjectFormState>;
        reorderProjects: (idsInOrder: string[]) => Promise<AdminProjectFormState>;
        updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
      }>;
    }) => {
      createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
      deleteProject: (id: string) => Promise<AdminProjectFormState>;
      reorderProjects: (idsInOrder: string[]) => Promise<AdminProjectFormState>;
      updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
    };
  }>("./action-core.ts", "admin projects actions");

  const redirectError = { digest: "NEXT_REDIRECT;replace;/admin/projects;303" };
  const actions = actionsModule.createAdminProjectServerActions({
    getActions: async () => ({
      createProject: async () => ({ error: null }),
      deleteProject: async () => {
        throw redirectError;
      },
      reorderProjects: async () => ({ error: null }),
      updateProject: async () => ({ error: null }),
    }),
  });

  await assert.rejects(() => actions.deleteProject("project-1"), (error) => error === redirectError);
});

test("reorderAdminProjectsAction server wrapper returns a controlled error for async rejection", async () => {
  const actionsModule = await loadModule<{
    createAdminProjectServerActions: (input: {
      getActions: () => Promise<{
        createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
        deleteProject: (id: string) => Promise<AdminProjectFormState>;
        reorderProjects: (idsInOrder: string[]) => Promise<AdminProjectFormState>;
        updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
      }>;
    }) => {
      createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
      deleteProject: (id: string) => Promise<AdminProjectFormState>;
      reorderProjects: (idsInOrder: string[]) => Promise<AdminProjectFormState>;
      updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
    };
  }>("./action-core.ts", "admin projects actions");

  const serviceModule = await import("../../../lib/content/service.ts");
  const actions = actionsModule.createAdminProjectServerActions({
    getActions: async () => ({
      createProject: async () => ({ error: null }),
      deleteProject: async () => ({ error: null }),
      reorderProjects: async () => {
        throw new serviceModule.InvalidContentOrderError("專案", "不可為空。");
      },
      updateProject: async () => ({ error: null }),
    }),
  });

  const result = await actions.reorderProjects([]);

  assert.deepEqual(result, {
    error: "專案排序資料不可為空。",
  });
});
