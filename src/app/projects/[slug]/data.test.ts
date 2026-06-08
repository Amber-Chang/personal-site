import assert from "node:assert/strict";
import test from "node:test";

type ProjectRecord = {
  content: string;
  id: string;
  outcomes: string[];
  period: string;
  role: string;
  slug: string;
  summary: string;
  tags: string[];
  title: string;
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

function createProject(overrides?: Partial<ProjectRecord>): ProjectRecord {
  return {
    content: "專案內容",
    id: "project-1",
    outcomes: ["把需求整理成可執行流程"],
    period: "2025",
    role: "PM",
    slug: "sms-management-platform",
    summary: "把分散需求產品化。",
    tags: ["產品策略"],
    title: "簡訊管理平台",
    ...overrides,
  };
}

function createPost(overrides?: Partial<BlogPostRecord>): BlogPostRecord {
  return {
    contentMarkdown: "第一段內容\n\n第二段內容",
    createdAt: "2026-06-02T00:00:00.000Z",
    excerpt: "文章摘要",
    id: "post-1",
    publishedAt: "2026-06-02T10:00:00.000Z",
    relatedProjectId: "project-1",
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

test("loadProjectPageData maps project data with related published posts for rendering", async () => {
  const dataModule = await loadModule<{
    loadProjectPageData: (input: {
      service: {
        getPublicProjectBySlug: (slug: string) => Promise<ProjectRecord | null>;
        listPostsByProjectId: (projectId: string) => Promise<BlogPostRecord[]>;
      };
      slug: string;
    }) => Promise<{
      content: string;
      outcomes: string[];
      period: string;
      relatedPosts: Array<{
        date: string;
        description: string;
        slug: string;
        title: string;
      }>;
      role: string;
      slug: string;
      summary: string;
      tags: string[];
      title: string;
    } | null>;
  }>("./data.ts", "project data");

  const projectSlugs: string[] = [];
  const projectIds: string[] = [];
  const result = await dataModule.loadProjectPageData({
    slug: "sms-management-platform",
    service: {
      getPublicProjectBySlug: async (slug) => {
        projectSlugs.push(slug);

        return createProject();
      },
      listPostsByProjectId: async (projectId) => {
        projectIds.push(projectId);

        return [
          createPost({
            excerpt: "這篇文章拆解專案中的內容策略。",
            slug: "content-strategy-post",
            title: "內容策略文章",
          }),
        ];
      },
    },
  });

  assert.deepEqual(projectSlugs, ["sms-management-platform"]);
  assert.deepEqual(projectIds, ["project-1"]);
  assert.deepEqual(result, {
    content: "專案內容",
    outcomes: ["把需求整理成可執行流程"],
    period: "2025",
    relatedPosts: [
      {
        date: "2026-06-02T10:00:00.000Z",
        description: "這篇文章拆解專案中的內容策略。",
        slug: "content-strategy-post",
        title: "內容策略文章",
      },
    ],
    role: "PM",
    slug: "sms-management-platform",
    summary: "把分散需求產品化。",
    tags: ["產品策略"],
    title: "簡訊管理平台",
  });
});

test("loadProjectPageData falls back to an empty related post list when no published posts are linked", async () => {
  const dataModule = await loadModule<{
    loadProjectPageData: (input: {
      service: {
        getPublicProjectBySlug: (slug: string) => Promise<ProjectRecord | null>;
        listPostsByProjectId: (projectId: string) => Promise<BlogPostRecord[]>;
      };
      slug: string;
    }) => Promise<{
      content: string;
      outcomes: string[];
      period: string;
      relatedPosts: Array<{
        date: string;
        description: string;
        slug: string;
        title: string;
      }>;
      role: string;
      slug: string;
      summary: string;
      tags: string[];
      title: string;
    } | null>;
  }>("./data.ts", "project data");

  const projectSlugs: string[] = [];
  const projectIds: string[] = [];
  const result = await dataModule.loadProjectPageData({
    slug: "sms-management-platform",
    service: {
      getPublicProjectBySlug: async (slug) => {
        projectSlugs.push(slug);

        return createProject();
      },
      listPostsByProjectId: async (projectId) => {
        projectIds.push(projectId);

        return [];
      },
    },
  });

  assert.deepEqual(projectSlugs, ["sms-management-platform"]);
  assert.deepEqual(projectIds, ["project-1"]);
  assert.deepEqual(result, {
    content: "專案內容",
    outcomes: ["把需求整理成可執行流程"],
    period: "2025",
    relatedPosts: [],
    role: "PM",
    slug: "sms-management-platform",
    summary: "把分散需求產品化。",
    tags: ["產品策略"],
    title: "簡訊管理平台",
  });
});

test("loadProjectPageData maps related posts returned by the public content contract", async () => {
  const dataModule = await loadModule<{
    loadProjectPageData: (input: {
      service: {
        getPublicProjectBySlug: (slug: string) => Promise<ProjectRecord | null>;
        listPostsByProjectId: (projectId: string) => Promise<BlogPostRecord[]>;
      };
      slug: string;
    }) => Promise<{
      content: string;
      outcomes: string[];
      period: string;
      relatedPosts: Array<{
        date: string;
        description: string;
        slug: string;
        title: string;
      }>;
      role: string;
      slug: string;
      summary: string;
      tags: string[];
      title: string;
    } | null>;
  }>("./data.ts", "project data");

  const projectSlugs: string[] = [];
  const projectIds: string[] = [];
  const result = await dataModule.loadProjectPageData({
    slug: "sms-management-platform",
    service: {
      getPublicProjectBySlug: async (slug) => {
        projectSlugs.push(slug);

        return createProject();
      },
      listPostsByProjectId: async (projectId) => {
        projectIds.push(projectId);

        return [
          createPost({
            excerpt: "這篇文章拆解專案中的內容策略。",
            slug: "content-strategy-post",
            title: "內容策略文章",
          }),
          createPost({
            id: "post-2",
            excerpt: "第二篇文章補充這個案例的流程拆解。",
            publishedAt: "2026-06-03T10:00:00.000Z",
            slug: "workflow-breakdown-post",
            title: "流程拆解文章",
            updatedAt: "2026-06-03T12:00:00.000Z",
          }),
        ];
      },
    },
  });

  assert.deepEqual(projectSlugs, ["sms-management-platform"]);
  assert.deepEqual(projectIds, ["project-1"]);
  assert.deepEqual(result, {
    content: "專案內容",
    outcomes: ["把需求整理成可執行流程"],
    period: "2025",
    relatedPosts: [
      {
        date: "2026-06-02T10:00:00.000Z",
        description: "這篇文章拆解專案中的內容策略。",
        slug: "content-strategy-post",
        title: "內容策略文章",
      },
      {
        date: "2026-06-03T10:00:00.000Z",
        description: "第二篇文章補充這個案例的流程拆解。",
        slug: "workflow-breakdown-post",
        title: "流程拆解文章",
      },
    ],
    role: "PM",
    slug: "sms-management-platform",
    summary: "把分散需求產品化。",
    tags: ["產品策略"],
    title: "簡訊管理平台",
  });
});
