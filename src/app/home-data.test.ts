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

function createPost(index: number): BlogPostRecord {
  return {
    contentMarkdown: `Post ${index}`,
    createdAt: "2026-06-02T00:00:00.000Z",
    excerpt: null,
    id: `post-${index}`,
    publishedAt: `2026-02-${String(index).padStart(2, "0")}T00:00:00.000Z`,
    relatedProjectId: null,
    slug: `post-${index}`,
    status: "published",
    title: `Post ${index}`,
    updatedAt: "2026-06-02T00:00:00.000Z",
  };
}

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("loadHomeWritingData lists latest public posts for the homepage", async () => {
  const dataModule = await loadModule<{
    loadHomeWritingData: (input: {
      limit?: number;
      service: {
        listPublicPosts: () => Promise<BlogPostRecord[]>;
      };
    }) => Promise<{
      posts: Array<{
        date: string;
        excerpt: string | null;
        slug: string;
        tags: string[];
        title: string;
      }>;
    }>;
  }>("./home-data.ts", "home data");

  const result = await dataModule.loadHomeWritingData({
    limit: 2,
    service: {
      listPublicPosts: async () => [createPost(1), createPost(2), createPost(3)],
    },
  });

  assert.deepEqual(result, {
    posts: [
      {
        date: "2026-02-01T00:00:00.000Z",
        excerpt: null,
        slug: "post-1",
        tags: [],
        title: "Post 1",
      },
      {
        date: "2026-02-02T00:00:00.000Z",
        excerpt: null,
        slug: "post-2",
        tags: [],
        title: "Post 2",
      },
    ],
  });
});

test("loadHomeWritingData defaults to the first 3 posts in their existing order and cleans up each excerpt", async () => {
  const dataModule = await loadModule<{
    loadHomeWritingData: (input: {
      service: { listPublicPosts: () => Promise<BlogPostRecord[]> };
    }) => Promise<{ posts: Array<{ excerpt: string | null; slug: string }> }>;
  }>("./home-data.ts", "home data");

  const posts = [createPost(4), createPost(2), createPost(9), createPost(1)];
  posts[0] = { ...posts[0], excerpt: "第一段。\r\n\r\n第二段。" };
  posts[1] = { ...posts[1], excerpt: "   " };
  posts[2] = { ...posts[2], excerpt: "長".repeat(100) };

  const result = await dataModule.loadHomeWritingData({
    service: { listPublicPosts: async () => posts },
  });

  assert.deepEqual(
    result.posts.map((post) => post.slug),
    ["post-4", "post-2", "post-9"],
  );
  assert.equal(result.posts[0]?.excerpt, "第一段。第二段。");
  assert.equal(result.posts[1]?.excerpt, null);
  assert.equal(result.posts[2]?.excerpt, `${"長".repeat(80)}…`);
});

type HomeProject = {
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

function createProject(index: number, overrides?: Partial<HomeProject>): HomeProject {
  return {
    featured: false,
    id: `project-${index}`,
    outcomes: [`Outcome ${index}`, `Second outcome ${index}`],
    period: "2025",
    projectType: "work",
    role: `Role ${index}`,
    slug: `project-${index}`,
    summary: `Summary ${index}`,
    tags: [],
    title: `Project ${index}`,
    ...overrides,
  };
}

type HomeProjectsModule = {
  loadHomeFeaturedProjectsData: (input: {
    limit?: number;
    service: { listPublicProjects: () => Promise<HomeProject[]> };
  }) => Promise<{
    projects: Array<{
      firstOutcome: string | null;
      role: string | null;
      slug: string;
      summary: string;
      title: string;
      typeLabel: string | null;
    }>;
  }>;
  selectHomeProjects: <T extends { featured: boolean }>(projects: T[], limit?: number) => T[];
};

const loadHomeProjectsModule = () => loadModule<HomeProjectsModule>("./home-data.ts", "home data");

test("selectHomeProjects keeps only featured projects, in their existing order, up to 3", async () => {
  const { selectHomeProjects } = await loadHomeProjectsModule();
  const projects = [1, 2, 3, 4, 5, 6].map((index) => createProject(index, { featured: index !== 2 }));

  assert.deepEqual(
    selectHomeProjects(projects).map((project) => project.slug),
    ["project-1", "project-3", "project-4"],
  );
});

test("selectHomeProjects does not pad featured projects with unfeatured ones", async () => {
  const { selectHomeProjects } = await loadHomeProjectsModule();
  const projects = [createProject(1), createProject(2, { featured: true }), createProject(3)];

  assert.deepEqual(
    selectHomeProjects(projects).map((project) => project.slug),
    ["project-2"],
  );
});

test("selectHomeProjects falls back to the first 3 published projects when none is featured", async () => {
  const { selectHomeProjects } = await loadHomeProjectsModule();
  const projects = [1, 2, 3, 4].map((index) => createProject(index));

  assert.deepEqual(
    selectHomeProjects(projects).map((project) => project.slug),
    ["project-1", "project-2", "project-3"],
  );
});

test("selectHomeProjects returns an empty list only when there are no published projects", async () => {
  const { selectHomeProjects } = await loadHomeProjectsModule();

  assert.deepEqual(selectHomeProjects([]), []);
  assert.equal(selectHomeProjects([createProject(1)]).length, 1);
});

test("loadHomeFeaturedProjectsData reads published projects once and returns highlight cards", async () => {
  const { loadHomeFeaturedProjectsData } = await loadHomeProjectsModule();
  const calls: string[] = [];

  const result = await loadHomeFeaturedProjectsData({
    service: {
      listPublicProjects: async () => {
        calls.push("listPublicProjects");
        return [
          createProject(1, { featured: true, projectType: "research" }),
          createProject(2),
          createProject(3, { featured: true, outcomes: [], projectType: null, role: "" }),
        ];
      },
    },
  });

  assert.deepEqual(calls, ["listPublicProjects"]);
  assert.deepEqual(result, {
    projects: [
      { firstOutcome: "Outcome 1", role: "Role 1", slug: "project-1", summary: "Summary 1", title: "Project 1", typeLabel: "研究" },
      { firstOutcome: null, role: null, slug: "project-3", summary: "Summary 3", title: "Project 3", typeLabel: null },
    ],
  });
});
