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
        slug: "post-1",
        tags: [],
        title: "Post 1",
      },
      {
        date: "2026-02-02T00:00:00.000Z",
        slug: "post-2",
        tags: [],
        title: "Post 2",
      },
    ],
  });
});

test("loadHomeFeaturedProjectsData lists featured public projects for the homepage", async () => {
  const dataModule = await loadModule<{
    loadHomeFeaturedProjectsData: (input: {
      limit?: number;
      service: {
        listFeaturedProjects: () => Promise<
          Array<{
            featured: boolean;
            id: string;
            outcomes: string[];
            period: string;
            role: string;
            slug: string;
            summary: string;
            tags: string[];
            title: string;
          }>
        >;
      };
    }) => Promise<{
      projects: Array<{
        featured: boolean;
        id: string;
        outcomes: string[];
        period: string;
        role: string;
        slug: string;
        summary: string;
        tags: string[];
        title: string;
      }>;
    }>;
  }>("./home-data.ts", "home data");

  const result = await dataModule.loadHomeFeaturedProjectsData({
    limit: 1,
    service: {
      listFeaturedProjects: async () => [
        {
          featured: true,
          id: "project-1",
          outcomes: ["Outcome 1"],
          period: "2025",
          role: "PM",
          slug: "project-1",
          summary: "Summary 1",
          tags: ["Tag 1"],
          title: "Project 1",
        },
        {
          featured: true,
          id: "project-2",
          outcomes: ["Outcome 2"],
          period: "2026",
          role: "Product",
          slug: "project-2",
          summary: "Summary 2",
          tags: ["Tag 2"],
          title: "Project 2",
        },
      ],
    },
  });

  assert.deepEqual(result, {
    projects: [
      {
        featured: true,
        id: "project-1",
        outcomes: ["Outcome 1"],
        period: "2025",
        role: "PM",
        slug: "project-1",
        summary: "Summary 1",
        tags: ["Tag 1"],
        title: "Project 1",
      },
    ],
  });
});
