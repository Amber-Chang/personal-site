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

type RelatedProjectRecord = {
  id: string;
  projectType?: string | null;
  role?: string;
  slug: string;
  summary: string;
  title: string;
};

function createPost(overrides?: Partial<BlogPostRecord>): BlogPostRecord {
  return {
    contentMarkdown: "第一段內容\n\n第二段內容",
    createdAt: "2026-06-02T00:00:00.000Z",
    excerpt: "文章摘要",
    id: "post-1",
    publishedAt: "2026-06-02T10:00:00.000Z",
    relatedProjectId: null,
    slug: "published-post",
    status: "published",
    title: "Published post",
    updatedAt: "2026-06-02T12:00:00.000Z",
    ...overrides,
  };
}

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("loadBlogIndexPageData lists every published post with its excerpt and the tab counts", async () => {
  const dataModule = await loadModule<{
    loadBlogIndexPageData: (input: {
      service: {
        listPublicPosts: () => Promise<BlogPostRecord[]>;
        listPublicProjects: () => Promise<unknown[]>;
      };
    }) => Promise<{
      counts: { cases: number; posts: number };
      posts: Array<{ date: string; excerpt: string | null; slug: string; title: string }>;
    }>;
  }>("./data.ts", "blog data");

  const result = await dataModule.loadBlogIndexPageData({
    service: {
      listPublicPosts: async () => [
        { ...createPost(), excerpt: "  第一行\n第二行  " },
        { ...createPost(), excerpt: null, slug: "no-excerpt", title: "No excerpt" },
      ],
      listPublicProjects: async () => [{}, {}],
    },
  });

  assert.deepEqual(result, {
    counts: { cases: 2, posts: 2 },
    posts: [
      { date: "2026-06-02T10:00:00.000Z", excerpt: "第一行第二行", slug: "published-post", title: "Published post" },
      { date: "2026-06-02T10:00:00.000Z", excerpt: null, slug: "no-excerpt", title: "No excerpt" },
    ],
  });
});

test("loadBlogIndexPageData keeps working with no posts", async () => {
  const dataModule = await loadModule<{
    loadBlogIndexPageData: (input: {
      service: { listPublicPosts: () => Promise<BlogPostRecord[]>; listPublicProjects: () => Promise<unknown[]> };
    }) => Promise<{ counts: { cases: number; posts: number }; posts: unknown[] }>;
  }>("./data.ts", "blog data");

  assert.deepEqual(
    await dataModule.loadBlogIndexPageData({ service: { listPublicPosts: async () => [], listPublicProjects: async () => [] } }),
    { counts: { cases: 0, posts: 0 }, posts: [] },
  );
});

test("loadBlogPostPageData returns null when the public post does not exist", async () => {
  const dataModule = await loadModule<{
    loadBlogPostPageData: (input: {
      service: {
        getPublicPostBySlug: (slug: string) => Promise<BlogPostRecord | null>;
      };
      slug: string;
    }) => Promise<unknown>;
  }>("./data.ts", "blog data");

  const calls: string[] = [];
  const result = await dataModule.loadBlogPostPageData({
    slug: "draft-post",
    service: {
      getPublicPostBySlug: async (slug) => {
        calls.push(slug);

        return null;
      },
    },
  });

  assert.equal(result, null);
  assert.deepEqual(calls, ["draft-post"]);
});

test("loadBlogPostPageData maps a public post for metadata and rendering", async () => {
  const dataModule = await loadModule<{
    loadBlogPostPageData: (input: {
      service: {
        getPublicPostBySlug: (slug: string) => Promise<BlogPostRecord | null>;
      };
      slug: string;
    }) => Promise<{
      content: string;
      date: string;
      description: string;
      slug: string;
      tags: string[];
      title: string;
    } | null>;
  }>("./data.ts", "blog data");

  const result = await dataModule.loadBlogPostPageData({
    slug: "published-post",
    service: {
      getPublicPostBySlug: async () =>
        createPost({
          excerpt: null,
          contentMarkdown: "第一段內容\n\n第二段內容",
        }),
    },
  });

  assert.ok(result);
  assert.equal(result.content, "第一段內容\n\n第二段內容");
  assert.equal(result.date, "2026-06-02T10:00:00.000Z");
  assert.equal(result.slug, "published-post");
  assert.deepEqual(result.tags, []);
  assert.equal(result.title, "Published post");
  assert.equal(typeof result.description, "string");
  assert.notEqual(result.description.length, 0);
  assert.match(result.description, /第一段內容/);
  assert.match(result.description, /第二段內容/);
});

test("loadBlogPostPageData includes related project context when the post references a resolvable project", async () => {
  const dataModule = await loadModule<{
    loadBlogPostPageData: (input: {
      service: {
        getPublicProjectById: (id: string) => Promise<RelatedProjectRecord | null>;
        getPublicPostBySlug: (slug: string) => Promise<BlogPostRecord | null>;
      };
      slug: string;
    }) => Promise<{
      content: string;
      date: string;
      description: string;
      relatedProject: {
        role: string | null;
        slug: string;
        summary: string;
        title: string;
        typeLabel: string | null;
      } | null;
      slug: string;
      tags: string[];
      title: string;
    } | null>;
  }>("./data.ts", "blog data");

  const publicPostSlugs: string[] = [];
  const projectIds: string[] = [];
  const result = await dataModule.loadBlogPostPageData({
    slug: "published-post",
    service: {
      getPublicProjectById: async (id) => {
        projectIds.push(id);

        return {
          id,
          projectType: "work",
          role: "  Product Manager ",
          slug: "sms-management-platform",
          summary: "把分散的營運需求產品化。",
          title: "簡訊管理平台",
        };
      },
      getPublicPostBySlug: async (slug) => {
        publicPostSlugs.push(slug);

        return createPost({
          relatedProjectId: "project-1",
        });
      },
    },
  });

  assert.deepEqual(publicPostSlugs, ["published-post"]);
  assert.deepEqual(projectIds, ["project-1"]);
  assert.deepEqual(result, {
    content: "第一段內容\n\n第二段內容",
    date: "2026-06-02T10:00:00.000Z",
    description: "文章摘要",
    // 文章內頁底部的「相關案例」顯示標題與「類型 · 角色」（SPEC-004）。
    relatedProject: {
      role: "Product Manager",
      slug: "sms-management-platform",
      summary: "把分散的營運需求產品化。",
      title: "簡訊管理平台",
      typeLabel: "工作案例",
    },
    slug: "published-post",
    tags: [],
    title: "Published post",
  });
});

test("loadBlogPostPageData falls back to a null related project when the reference cannot be resolved", async () => {
  const dataModule = await loadModule<{
    loadBlogPostPageData: (input: {
      service: {
        getPublicProjectById: (id: string) => Promise<RelatedProjectRecord | null>;
        getPublicPostBySlug: (slug: string) => Promise<BlogPostRecord | null>;
      };
      slug: string;
    }) => Promise<{
      content: string;
      date: string;
      description: string;
      relatedProject: {
        role: string | null;
        slug: string;
        summary: string;
        title: string;
        typeLabel: string | null;
      } | null;
      slug: string;
      tags: string[];
      title: string;
    } | null>;
  }>("./data.ts", "blog data");

  const publicPostSlugs: string[] = [];
  const projectIds: string[] = [];
  const result = await dataModule.loadBlogPostPageData({
    slug: "published-post",
    service: {
      getPublicProjectById: async (id) => {
        projectIds.push(id);

        return null;
      },
      getPublicPostBySlug: async (slug) => {
        publicPostSlugs.push(slug);

        return createPost({
          relatedProjectId: "project-missing",
        });
      },
    },
  });

  assert.deepEqual(publicPostSlugs, ["published-post"]);
  assert.deepEqual(projectIds, ["project-missing"]);
  assert.deepEqual(result, {
    content: "第一段內容\n\n第二段內容",
    date: "2026-06-02T10:00:00.000Z",
    description: "文章摘要",
    relatedProject: null,
    slug: "published-post",
    tags: [],
    title: "Published post",
  });
});

test("loadBlogPostPageData falls back to a null related project when the post has no related project reference", async () => {
  const dataModule = await loadModule<{
    loadBlogPostPageData: (input: {
      service: {
        getPublicProjectById: (id: string) => Promise<RelatedProjectRecord | null>;
        getPublicPostBySlug: (slug: string) => Promise<BlogPostRecord | null>;
      };
      slug: string;
    }) => Promise<{
      content: string;
      date: string;
      description: string;
      relatedProject: {
        role: string | null;
        slug: string;
        summary: string;
        title: string;
        typeLabel: string | null;
      } | null;
      slug: string;
      tags: string[];
      title: string;
    } | null>;
  }>("./data.ts", "blog data");

  const publicPostSlugs: string[] = [];
  const projectIds: string[] = [];
  const result = await dataModule.loadBlogPostPageData({
    slug: "published-post",
    service: {
      getPublicProjectById: async (id) => {
        projectIds.push(id);

        return null;
      },
      getPublicPostBySlug: async (slug) => {
        publicPostSlugs.push(slug);

        return createPost({
          relatedProjectId: null,
        });
      },
    },
  });

  assert.deepEqual(publicPostSlugs, ["published-post"]);
  assert.equal(projectIds.length, 0);
  assert.deepEqual(result, {
    content: "第一段內容\n\n第二段內容",
    date: "2026-06-02T10:00:00.000Z",
    description: "文章摘要",
    relatedProject: null,
    slug: "published-post",
    tags: [],
    title: "Published post",
  });
});

test("loadBlogPostPageData drops the related project once that project is unpublished (Supabase path)", async () => {
  const dataModule = await loadModule<{
    loadBlogPostPageData: (input: {
      service: {
        getPublicProjectById: (id: string) => Promise<unknown>;
        getPublicPostBySlug: (slug: string) => Promise<BlogPostRecord | null>;
      };
      slug: string;
    }) => Promise<{ relatedProject: unknown; title: string } | null>;
  }>("./data.ts", "blog data");
  const { SupabaseProjectsRepository } = await import("../../lib/infra/repositories/supabase-projects-repository.ts");

  // 假 client 依 eq() 篩選：「工作隨筆」仍在資料表裡，但 status 已是 draft，公開查詢拿不到它。
  const rows = [{ id: "p3", outcomes: [], project_type: "side", slug: "turning-work-into-thinking", status: "draft", tags: [], title: "工作隨筆" }];
  const client = {
    from: () => ({
      select: () => {
        let filtered = [...rows] as Array<Record<string, unknown>>;
        const builder = {
          eq(column: string, value: unknown) {
            filtered = filtered.filter((row) => row[column] === value);
            return builder;
          },
          maybeSingle: async () => ({ data: filtered[0] ?? null, error: null }),
        };
        return builder;
      },
    }),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = new SupabaseProjectsRepository(client as any);

  const result = await dataModule.loadBlogPostPageData({
    slug: "build-it-vs-build-it-right",
    service: {
      getPublicProjectById: (id) => projects.getPublicProjectById(id),
      getPublicPostBySlug: async () => createPost({ relatedProjectId: "p3" }),
    },
  });

  assert.equal(result?.title, "Published post");
  assert.equal(result?.relatedProject, null);
});
