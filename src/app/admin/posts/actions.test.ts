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
  sortOrder: number;
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
    sortOrder: 1,
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
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
      };
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
    initialAdminPostFormState: AdminPostFormState;
  }>("./action-core.ts", "admin posts actions");

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
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
      };
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
    initialAdminPostFormState: AdminPostFormState;
  }>("./action-core.ts", "admin posts actions");

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

test("updateAdminPostAction can publish an existing draft from the submit intent", async () => {
  const actionsModule = await loadModule<{
    createAdminPostMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
      };
    }) => {
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
    initialAdminPostFormState: AdminPostFormState;
  }>("./action-core.ts", "admin posts actions");

  const updateCalls: Array<{ id: string; input: UpdateBlogPostInput }> = [];
  const actions = actionsModule.createAdminPostMutationActions({
    redirectTo: (path) => {
      throw new Error(`redirect:${path}`);
    },
    revalidatePath: () => {},
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
    ["id", "post-10"],
    ["title", "Draft post"],
    ["slug", "draft-post"],
    ["excerpt", ""],
    ["content_markdown", "Draft markdown"],
    ["status", "draft"],
    ["intent", "publish"],
    ["related_project_id", ""],
  ]);

  await assert.rejects(
    () => actions.updatePost(actionsModule.initialAdminPostFormState, formData),
    /redirect:\/admin\/posts\/post-10/,
  );

  assert.deepEqual(updateCalls, [
    {
      id: "post-10",
      input: {
        title: "Draft post",
        slug: "draft-post",
        excerpt: null,
        contentMarkdown: "Draft markdown",
        status: "published",
        relatedProjectId: null,
      },
    },
  ]);
});

test("updateAdminPostAction can unpublish an existing post from the submit intent", async () => {
  const actionsModule = await loadModule<{
    createAdminPostMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
      };
    }) => {
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
    initialAdminPostFormState: AdminPostFormState;
  }>("./action-core.ts", "admin posts actions");

  const updateCalls: Array<{ id: string; input: UpdateBlogPostInput }> = [];
  const actions = actionsModule.createAdminPostMutationActions({
    redirectTo: (path) => {
      throw new Error(`redirect:${path}`);
    },
    revalidatePath: () => {},
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
    ["id", "post-11"],
    ["title", "Published post"],
    ["slug", "published-post"],
    ["excerpt", ""],
    ["content_markdown", "Published markdown"],
    ["status", "published"],
    ["intent", "draft"],
    ["related_project_id", ""],
  ]);

  await assert.rejects(
    () => actions.updatePost(actionsModule.initialAdminPostFormState, formData),
    /redirect:\/admin\/posts\/post-11/,
  );

  assert.deepEqual(updateCalls, [
    {
      id: "post-11",
      input: {
        title: "Published post",
        slug: "published-post",
        excerpt: null,
        contentMarkdown: "Published markdown",
        status: "draft",
        relatedProjectId: null,
      },
    },
  ]);
});

test("updateAdminPostAction returns a controlled error when the post is missing", async () => {
  const actionsModule = await loadModule<{
    createAdminPostMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
      };
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
    initialAdminPostFormState: AdminPostFormState;
  }>("./action-core.ts", "admin posts actions");

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

test("reorderAdminPostsAction sends ids to the service and revalidates admin and public paths", async () => {
  const actionsModule = await loadModule<{
    createAdminPostMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
        reorderPosts: (idsInOrder: string[]) => Promise<void>;
        deletePost: (id: string) => Promise<void>;
      };
    }) => {
      reorderPosts: (idsInOrder: string[]) => Promise<{ error: string | null }>;
    };
  }>("./action-core.ts", "admin posts actions");

  const reorderCalls: string[][] = [];
  const revalidatedPaths: Array<{ path: string; type?: "layout" | "page" }> = [];

  const actions = actionsModule.createAdminPostMutationActions({
    redirectTo: (path) => {
      throw new Error(`unexpected redirect:${path}`);
    },
    revalidatePath: (path, type) => {
      revalidatedPaths.push({ path, type });
    },
    service: {
      createPost: async () => {
        throw new Error("createPost should not be called during reorder");
      },
      updatePost: async () => {
        throw new Error("updatePost should not be called during reorder");
      },
      reorderPosts: async (idsInOrder) => {
        reorderCalls.push(idsInOrder);
      },
      deletePost: async () => {
        throw new Error("deletePost should not be called during reorder");
      },
    },
  });

  const result = await actions.reorderPosts(["post-3", "post-1", "post-2"]);

  assert.deepEqual(result, { error: null });
  assert.deepEqual(reorderCalls, [["post-3", "post-1", "post-2"]]);
  assert.deepEqual(revalidatedPaths, [
    { path: "/admin/posts", type: undefined },
    { path: "/blog", type: undefined },
    { path: "/", type: undefined },
    { path: "/projects/[slug]", type: "page" },
  ]);
});

test("deleteAdminPostAction revalidates admin and public paths then redirects back to the list", async () => {
  const actionsModule = await loadModule<{
    createAdminPostMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
        reorderPosts: (idsInOrder: string[]) => Promise<void>;
        deletePost: (id: string) => Promise<void>;
      };
    }) => {
      deletePost: (id: string) => Promise<{ error: string | null }>;
    };
  }>("./action-core.ts", "admin posts actions");

  const deleteCalls: string[] = [];
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
        throw new Error("createPost should not be called during delete");
      },
      updatePost: async () => {
        throw new Error("updatePost should not be called during delete");
      },
      reorderPosts: async () => {
        throw new Error("reorderPosts should not be called during delete");
      },
      deletePost: async (id) => {
        deleteCalls.push(id);
      },
    },
  });

  await assert.rejects(() => actions.deletePost("post-2"), /redirect:\/admin\/posts/);

  assert.deepEqual(deleteCalls, ["post-2"]);
  assert.deepEqual(revalidatedPaths, ["/admin/posts", "/blog", "/"]);
  assert.deepEqual(redirects, ["/admin/posts"]);
});

test("deleteAdminPostAction returns a controlled error when deleting a published post", async () => {
  const actionsModule = await loadModule<{
    createAdminPostMutationActions: (input: {
      redirectTo: (path: string) => never;
      revalidatePath: (path: string, type?: "layout" | "page") => void;
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        updatePost: (id: string, input: UpdateBlogPostInput) => Promise<BlogPostRecord>;
        reorderPosts: (idsInOrder: string[]) => Promise<void>;
        deletePost: (id: string) => Promise<void>;
      };
    }) => {
      deletePost: (id: string) => Promise<{ error: string | null }>;
    };
  }>("./action-core.ts", "admin posts actions");

  const actions = actionsModule.createAdminPostMutationActions({
    redirectTo: (path) => {
      throw new Error(`unexpected redirect:${path}`);
    },
    revalidatePath: () => {},
    service: {
      createPost: async () => {
        throw new Error("createPost should not be called during delete");
      },
      updatePost: async () => {
        throw new Error("updatePost should not be called during delete");
      },
      reorderPosts: async () => {
        throw new Error("reorderPosts should not be called during delete");
      },
      deletePost: async () => {
        const serviceModule = await import("../../../lib/content/service.ts");
        throw new serviceModule.PublishedContentDeletionError("文章", "post-5");
      },
    },
  });

  const result = await actions.deletePost("post-5");

  assert.deepEqual(result, {
    error: "已上架文章不能直接刪除，請先下架再刪除。",
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
  }>("./action-core.ts", "admin posts actions");

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
  }>("./action-core.ts", "admin posts actions");

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

test("deleteAdminPostAction server wrapper returns a controlled error for async rejection", async () => {
  const actionsModule = await loadModule<{
    createAdminPostServerActions: (input: {
      getActions: () => Promise<{
        createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
        deletePost: (id: string) => Promise<AdminPostFormState>;
        reorderPosts: (idsInOrder: string[]) => Promise<AdminPostFormState>;
        updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      }>;
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      deletePost: (id: string) => Promise<AdminPostFormState>;
      reorderPosts: (idsInOrder: string[]) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
  }>("./action-core.ts", "admin posts actions");

  const guardsModule = await import("../../../lib/auth/guards.ts");
  const actions = actionsModule.createAdminPostServerActions({
    getActions: async () => ({
      createPost: async () => ({ error: null }),
      deletePost: async () => {
        throw new guardsModule.AdminAuthorizationError("unauthenticated");
      },
      reorderPosts: async () => ({ error: null }),
      updatePost: async () => ({ error: null }),
    }),
  });

  const result = await actions.deletePost("post-1");

  assert.deepEqual(result, {
    error: "登入狀態已失效，請重新登入。",
  });
});

test("deleteAdminPostAction server wrapper rethrows Next redirect errors", async () => {
  const actionsModule = await loadModule<{
    createAdminPostServerActions: (input: {
      getActions: () => Promise<{
        createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
        deletePost: (id: string) => Promise<AdminPostFormState>;
        reorderPosts: (idsInOrder: string[]) => Promise<AdminPostFormState>;
        updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      }>;
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      deletePost: (id: string) => Promise<AdminPostFormState>;
      reorderPosts: (idsInOrder: string[]) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
  }>("./action-core.ts", "admin posts actions");

  const redirectError = { digest: "NEXT_REDIRECT;replace;/admin/posts;303" };
  const actions = actionsModule.createAdminPostServerActions({
    getActions: async () => ({
      createPost: async () => ({ error: null }),
      deletePost: async () => {
        throw redirectError;
      },
      reorderPosts: async () => ({ error: null }),
      updatePost: async () => ({ error: null }),
    }),
  });

  await assert.rejects(() => actions.deletePost("post-1"), (error) => error === redirectError);
});

test("reorderAdminPostsAction server wrapper returns a controlled error for async rejection", async () => {
  const actionsModule = await loadModule<{
    createAdminPostServerActions: (input: {
      getActions: () => Promise<{
        createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
        deletePost: (id: string) => Promise<AdminPostFormState>;
        reorderPosts: (idsInOrder: string[]) => Promise<AdminPostFormState>;
        updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      }>;
    }) => {
      createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
      deletePost: (id: string) => Promise<AdminPostFormState>;
      reorderPosts: (idsInOrder: string[]) => Promise<AdminPostFormState>;
      updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    };
  }>("./action-core.ts", "admin posts actions");

  const serviceModule = await import("../../../lib/content/service.ts");
  const actions = actionsModule.createAdminPostServerActions({
    getActions: async () => ({
      createPost: async () => ({ error: null }),
      deletePost: async () => ({ error: null }),
      reorderPosts: async () => {
        throw new serviceModule.InvalidContentOrderError("文章", "不可包含重複 id。");
      },
      updatePost: async () => ({ error: null }),
    }),
  });

  const result = await actions.reorderPosts(["post-1", "post-1"]);

  assert.deepEqual(result, {
    error: "文章排序資料不可包含重複 id。",
  });
});
