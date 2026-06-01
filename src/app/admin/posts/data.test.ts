import assert from "node:assert/strict";
import test from "node:test";

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

type ProjectOption = {
  id: string;
  slug: string;
  title: string;
};

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

test("loadAdminPostsPageData lists posts through the admin content path", async () => {
  const dataModule = await loadModule<{
    loadAdminPostsPageData: (input: {
      service: {
        listAdminPosts: () => Promise<BlogPostRecord[]>;
      };
    }) => Promise<{ posts: BlogPostRecord[] }>;
  }>("./data.ts", "admin posts data");

  const calls: string[] = [];
  const posts = [createPost()];

  const result = await dataModule.loadAdminPostsPageData({
    service: {
      listAdminPosts: async () => {
        calls.push("listAdminPosts");
        return posts;
      },
    },
  });

  assert.deepEqual(calls, ["listAdminPosts"]);
  assert.deepEqual(result, { posts });
});

test("loadAdminPostEditPageData returns null when the post does not exist", async () => {
  const dataModule = await loadModule<{
    loadAdminPostEditPageData: (input: {
      id: string;
      service: {
        getAdminPostById: (id: string) => Promise<BlogPostRecord | null>;
        listProjectOptions: () => Promise<ProjectOption[]>;
      };
    }) => Promise<
      | {
          post: BlogPostRecord;
          projectOptions: ProjectOption[];
        }
      | null
    >;
  }>("./data.ts", "admin posts data");

  const calls: Array<{ method: string; value?: string }> = [];

  const result = await dataModule.loadAdminPostEditPageData({
    id: "missing-post",
    service: {
      getAdminPostById: async (id) => {
        calls.push({ method: "getAdminPostById", value: id });
        return null;
      },
      listProjectOptions: async () => {
        calls.push({ method: "listProjectOptions" });
        return [];
      },
    },
  });

  assert.equal(result, null);
  assert.deepEqual(calls, [
    { method: "getAdminPostById", value: "missing-post" },
    { method: "listProjectOptions" },
  ]);
});

test("loadAdminPostEditPageData preserves the existing related project when it is not in published options", async () => {
  const dataModule = await loadModule<{
    loadAdminPostEditPageData: (input: {
      id: string;
      service: {
        getAdminPostById: (id: string) => Promise<BlogPostRecord | null>;
        getProjectById: (id: string) => Promise<ProjectOption | null>;
        listProjectOptions: () => Promise<ProjectOption[]>;
      };
    }) => Promise<
      | {
          post: BlogPostRecord;
          projectOptions: ProjectOption[];
        }
      | null
    >;
  }>("./data.ts", "admin posts data");

  const existingProject = {
    id: "project-unpublished",
    slug: "hidden-project",
    title: "Hidden project",
  };
  const calls: Array<{ method: string; value?: string }> = [];

  const result = await dataModule.loadAdminPostEditPageData({
    id: "post-with-hidden-project",
    service: {
      getAdminPostById: async (id) => {
        calls.push({ method: "getAdminPostById", value: id });
        return createPost({
          id,
          relatedProjectId: "project-unpublished",
        });
      },
      getProjectById: async (id) => {
        calls.push({ method: "getProjectById", value: id });
        return id === "project-unpublished" ? existingProject : null;
      },
      listProjectOptions: async () => {
        calls.push({ method: "listProjectOptions" });
        return [{ id: "project-published", slug: "visible-project", title: "Visible project" }];
      },
    },
  });

  assert.deepEqual(result, {
    post: createPost({
      id: "post-with-hidden-project",
      relatedProjectId: "project-unpublished",
    }),
    projectOptions: [
      { id: "project-published", slug: "visible-project", title: "Visible project" },
      existingProject,
    ],
  });
  assert.deepEqual(calls, [
    { method: "getAdminPostById", value: "post-with-hidden-project" },
    { method: "listProjectOptions" },
    { method: "getProjectById", value: "project-unpublished" },
  ]);
});
