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

test("loadBlogIndexPageData maps public posts for the list UI", async () => {
  const dataModule = await loadModule<{
    loadBlogIndexPageData: (input: {
      service: {
        listPublicPosts: () => Promise<BlogPostRecord[]>;
      };
    }) => Promise<{
      posts: Array<{
        date: string;
        slug: string;
        tags: string[];
        title: string;
      }>;
    }>;
  }>("./data.ts", "blog data");

  const calls: string[] = [];
  const result = await dataModule.loadBlogIndexPageData({
    service: {
      listPublicPosts: async () => {
        calls.push("listPublicPosts");

        return [createPost()];
      },
    },
  });

  assert.deepEqual(calls, ["listPublicPosts"]);
  assert.deepEqual(result, {
    posts: [
      {
        date: "2026-06-02T10:00:00.000Z",
        slug: "published-post",
        tags: [],
        title: "Published post",
      },
    ],
  });
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
        slug: string;
        summary: string;
        title: string;
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
    relatedProject: {
      slug: "sms-management-platform",
      summary: "把分散的營運需求產品化。",
      title: "簡訊管理平台",
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
        slug: string;
        summary: string;
        title: string;
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
        slug: string;
        summary: string;
        title: string;
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
