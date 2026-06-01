import assert from "node:assert/strict";
import test from "node:test";

type AdminPostFormState = {
  error: string | null;
};

type BlogPostRecord = {
  contentMarkdown: string;
  createdAt: string;
  excerpt: string | null;
  id: string;
  publishedAt: string | null;
  relatedProjectId: string | null;
  slug: string;
  status: "draft" | "published";
  title: string;
  updatedAt: string;
};

type CreateBlogPostInput = {
  contentMarkdown: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  relatedProjectId?: string | null;
  slug: string;
  status?: "draft" | "published";
  title: string;
};

type UpdateBlogPostInput = Partial<CreateBlogPostInput>;

function createPost(overrides?: Partial<BlogPostRecord>): BlogPostRecord {
  return {
    contentMarkdown: "## Draft",
    createdAt: "2026-06-02T00:00:00.000Z",
    excerpt: "Post excerpt",
    id: "post-1",
    publishedAt: null,
    relatedProjectId: null,
    slug: "draft-post",
    status: "draft",
    title: "Draft post",
    updatedAt: "2026-06-02T00:00:00.000Z",
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

test("createAdminPostAction creates a draft and redirects to the edit page", async () => {
  const actionsModule = await loadModule<{
    createAdminPostMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string) => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
      };
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
    initialAdminPostFormState: AdminPostFormState;
  }>("./actions.ts", "admin posts actions");

  const createCalls: CreateBlogPostInput[] = [];
  const revalidatedPaths: string[] = [];
  const redirects: string[] = [];

  const actions = actionsModule.createAdminPostMutationActions({
    redirectTo: (path) => {
      redirects.push(path);
      throw new Error(`redirect:${path}`);
    },
    revalidatePath: (path) => {
      revalidatedPaths.push(path);
    },
    service: {
      createPost: async (input) => {
        createCalls.push(input);
        return createPost({ id: "created-post", ...input });
      },
      updatePost: async () => {
        throw new Error("updatePost should not be called during create");
      },
    },
  });

  const formData = createFormData([
    ["title", "  New draft post  "],
    ["slug", "  new-draft-post  "],
    ["excerpt", "   "],
    ["content_markdown", "# Hello world"],
    ["status", "draft"],
    ["related_project_id", ""],
  ]);

  await assert.rejects(
    () => actions.createPost(actionsModule.initialAdminPostFormState, formData),
    /redirect:\/admin\/posts\/created-post/,
  );

  assert.deepEqual(createCalls, [
    {
      title: "New draft post",
      slug: "new-draft-post",
      excerpt: null,
      contentMarkdown: "# Hello world",
      status: "draft",
      relatedProjectId: null,
    },
  ]);
  assert.deepEqual(revalidatedPaths, ["/admin/posts", "/admin/posts/created-post"]);
  assert.deepEqual(redirects, ["/admin/posts/created-post"]);
});

test("updateAdminPostAction updates an existing post and redirects back to the edit page", async () => {
  const actionsModule = await loadModule<{
    createAdminPostMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string) => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
      };
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
    initialAdminPostFormState: AdminPostFormState;
  }>("./actions.ts", "admin posts actions");

  const updateCalls: Array<{ id: string; input: UpdateBlogPostInput }> = [];
  const revalidatedPaths: string[] = [];
  const redirects: string[] = [];

  const actions = actionsModule.createAdminPostMutationActions({
    redirectTo: (path) => {
      redirects.push(path);
      throw new Error(`redirect:${path}`);
    },
    revalidatePath: (path) => {
      revalidatedPaths.push(path);
    },
    service: {
      createPost: async () => {
        throw new Error("createPost should not be called during update");
      },
      updatePost: async (id, input) => {
        updateCalls.push({ id, input });
        return createPost({ id, ...input });
      },
    },
  });

  const formData = createFormData([
    ["id", "post-9"],
    ["title", "  Updated post  "],
    ["slug", " updated-post "],
    ["excerpt", "Updated summary"],
    ["content_markdown", "Updated markdown"],
    ["status", "published"],
    ["related_project_id", "project-2"],
  ]);

  await assert.rejects(
    () => actions.updatePost(actionsModule.initialAdminPostFormState, formData),
    /redirect:\/admin\/posts\/post-9/,
  );

  assert.deepEqual(updateCalls, [
    {
      id: "post-9",
      input: {
        title: "Updated post",
        slug: "updated-post",
        excerpt: "Updated summary",
        contentMarkdown: "Updated markdown",
        status: "published",
        relatedProjectId: "project-2",
      },
    },
  ]);
  assert.deepEqual(revalidatedPaths, ["/admin/posts", "/admin/posts/post-9"]);
  assert.deepEqual(redirects, ["/admin/posts/post-9"]);
});

test("updateAdminPostAction returns a controlled error when the post is missing", async () => {
  const actionsModule = await loadModule<{
    createAdminPostMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string) => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
      };
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
    initialAdminPostFormState: AdminPostFormState;
  }>("./actions.ts", "admin posts actions");

  const actions = actionsModule.createAdminPostMutationActions({
    redirectTo: (path) => {
      throw new Error(`unexpected redirect:${path}`);
    },
    revalidatePath: () => {},
    service: {
      createPost: async () => {
        throw new Error("createPost should not be called during update");
      },
      updatePost: async () => {
        const serviceModule = await import("../../../lib/content/service.ts");
        throw new serviceModule.BlogPostNotFoundError("missing-post");
      },
    },
  });

  const formData = createFormData([
    ["id", "missing-post"],
    ["title", "Missing post"],
    ["slug", "missing-post"],
    ["excerpt", ""],
    ["content_markdown", ""],
    ["status", "draft"],
    ["related_project_id", ""],
  ]);

  const result = await actions.updatePost(actionsModule.initialAdminPostFormState, formData);

  assert.deepEqual(result, {
    error: "找不到指定文章。",
  });
});

test("createAdminPostAction returns a controlled error when the admin session is no longer allowed", async () => {
  const actionsModule = await loadModule<{
    createAdminPostServerActions: (input: {
      getActions: () => Promise<{
        createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
        updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      }>;
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
    initialAdminPostFormState: AdminPostFormState;
  }>("./actions.ts", "admin posts actions");

  const guardsModule = await import("../../../lib/auth/guards.ts");
  const actions = actionsModule.createAdminPostServerActions({
    getActions: async () => {
      throw new guardsModule.AdminAuthorizationError("unauthenticated");
    },
  });

  const result = await actions.createPost(
    actionsModule.initialAdminPostFormState,
    createFormData([
      ["title", "Draft"],
      ["slug", "draft"],
      ["excerpt", ""],
      ["content_markdown", ""],
      ["status", "draft"],
      ["related_project_id", ""],
    ]),
  );

  assert.deepEqual(result, {
    error: "登入狀態已失效，請重新登入。",
  });
});

test("updateAdminPostAction returns a controlled error when the admin allowlist no longer permits access", async () => {
  const actionsModule = await loadModule<{
    createAdminPostServerActions: (input: {
      getActions: () => Promise<{
        createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
        updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      }>;
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
    initialAdminPostFormState: AdminPostFormState;
  }>("./actions.ts", "admin posts actions");

  const guardsModule = await import("../../../lib/auth/guards.ts");
  const actions = actionsModule.createAdminPostServerActions({
    getActions: async () => {
      throw new guardsModule.AdminAuthorizationError("forbidden");
    },
  });

  const result = await actions.updatePost(
    actionsModule.initialAdminPostFormState,
    createFormData([
      ["id", "post-1"],
      ["title", "Draft"],
      ["slug", "draft"],
      ["excerpt", ""],
      ["content_markdown", ""],
      ["status", "draft"],
      ["related_project_id", ""],
    ]),
  );

  assert.deepEqual(result, {
    error: "登入狀態已失效，請重新登入。",
  });
});
