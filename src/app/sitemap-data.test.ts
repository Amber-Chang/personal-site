import assert from "node:assert/strict";
import test from "node:test";

type SitemapEntry = {
  lastModified?: string | Date;
  url: string;
};

type SitemapPost = {
  publishedAt?: string | null;
  slug: string;
  status?: "draft" | "published";
  updatedAt?: string | null;
};

type SitemapProject = {
  slug: string;
};

type SitemapContentService = {
  listPublicPosts: () => Promise<SitemapPost[]>;
  listPublicProjects: () => Promise<SitemapProject[]>;
};

type SitemapDataModule = {
  buildRobots: (input: { siteUrl: string | null }) => {
    rules: { allow?: string | string[]; disallow?: string | string[]; userAgent?: string | string[] };
    sitemap?: string;
  };
  buildSitemapEntries: (input: { posts: SitemapPost[]; projects: SitemapProject[]; siteUrl: string }) => SitemapEntry[];
  loadSitemapContent: (input: {
    getFallbackService: () => SitemapContentService;
    getPrimaryService: () => SitemapContentService;
    onFallback?: (error: unknown) => void;
  }) => Promise<{ posts: SitemapPost[]; projects: SitemapProject[]; source: "primary" | "fallback" | "none" }>;
};

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

const loadSitemapData = () => loadModule<SitemapDataModule>("./sitemap-data.ts", "sitemap data");

// SPEC-004：/projects 永久轉址到首頁，不再列在 sitemap；案例內頁照常列出。
test("buildSitemapEntries lists static pages, published posts and projects as absolute URLs", async () => {
  const { buildSitemapEntries } = await loadSitemapData();

  const entries = buildSitemapEntries({
    siteUrl: "https://amber.test",
    posts: [{ slug: "between-builder-and-pm", status: "published", updatedAt: "2026-10-01T00:00:00.000Z" }],
    projects: [{ slug: "ai-builder-workflow" }],
  });

  assert.deepEqual(
    entries.map((entry) => entry.url),
    [
      "https://amber.test/",
      "https://amber.test/about",
      "https://amber.test/blog",
      "https://amber.test/blog/between-builder-and-pm",
      "https://amber.test/projects/ai-builder-workflow",
    ],
  );
});

test("buildSitemapEntries leaves out draft posts", async () => {
  const { buildSitemapEntries } = await loadSitemapData();

  const urls = buildSitemapEntries({
    siteUrl: "https://amber.test",
    posts: [
      { slug: "published-post", status: "published" },
      { slug: "draft-post", status: "draft" },
    ],
    projects: [],
  }).map((entry) => entry.url);

  assert.ok(urls.includes("https://amber.test/blog/published-post"));
  assert.ok(!urls.some((url) => url.includes("draft-post")));
});

test("buildSitemapEntries handles a trailing slash on the site URL and encodes slugs", async () => {
  const { buildSitemapEntries } = await loadSitemapData();

  const urls = buildSitemapEntries({
    siteUrl: "https://amber.test/",
    posts: [{ slug: "a b" }],
    projects: [],
  }).map((entry) => entry.url);

  assert.equal(urls[0], "https://amber.test/");
  assert.ok(urls.includes("https://amber.test/blog/a%20b"));
  assert.ok(!urls.some((url) => url.includes("//blog") || url.includes("test//")));
});

test("buildSitemapEntries uses the post's updatedAt, then publishedAt, as lastModified", async () => {
  const { buildSitemapEntries } = await loadSitemapData();

  const entries = buildSitemapEntries({
    siteUrl: "https://amber.test",
    posts: [
      { slug: "updated", publishedAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-02-01T00:00:00.000Z" },
      { slug: "published-only", publishedAt: "2026-03-01T00:00:00.000Z", updatedAt: null },
      { slug: "no-dates" },
    ],
    projects: [],
  });
  const bySlug = (slug: string) => entries.find((entry) => entry.url.endsWith(`/blog/${slug}`));

  assert.equal(bySlug("updated")?.lastModified, "2026-02-01T00:00:00.000Z");
  assert.equal(bySlug("published-only")?.lastModified, "2026-03-01T00:00:00.000Z");
  assert.equal(bySlug("no-dates")?.lastModified, undefined);
});

test("loadSitemapContent reads from the primary public content service when it works", async () => {
  const { loadSitemapContent } = await loadSitemapData();
  let fallbackCalls = 0;

  const result = await loadSitemapContent({
    getPrimaryService: () => ({
      listPublicPosts: async () => [{ slug: "from-supabase" }],
      listPublicProjects: async () => [{ slug: "project-from-supabase" }],
    }),
    getFallbackService: () => {
      fallbackCalls += 1;
      return { listPublicPosts: async () => [], listPublicProjects: async () => [] };
    },
  });

  assert.equal(result.source, "primary");
  assert.deepEqual(result.posts, [{ slug: "from-supabase" }]);
  assert.deepEqual(result.projects, [{ slug: "project-from-supabase" }]);
  assert.equal(fallbackCalls, 0);
});

test("loadSitemapContent falls back to the Markdown source when Supabase cannot be reached", async () => {
  const { loadSitemapContent } = await loadSitemapData();
  const fallbackErrors: unknown[] = [];

  const result = await loadSitemapContent({
    getPrimaryService: () => ({
      listPublicPosts: async () => {
        throw new Error("fetch failed");
      },
      listPublicProjects: async () => [{ slug: "project-from-supabase" }],
    }),
    getFallbackService: () => ({
      listPublicPosts: async () => [{ slug: "from-markdown" }],
      listPublicProjects: async () => [{ slug: "project-from-markdown" }],
    }),
    onFallback: (error) => fallbackErrors.push(error),
  });

  assert.equal(result.source, "fallback");
  assert.deepEqual(result.posts, [{ slug: "from-markdown" }]);
  assert.deepEqual(result.projects, [{ slug: "project-from-markdown" }]);
  assert.equal(fallbackErrors.length, 1);
});

test("loadSitemapContent still resolves with no content when both sources fail", async () => {
  const { loadSitemapContent } = await loadSitemapData();

  const result = await loadSitemapContent({
    getPrimaryService: () => {
      throw new Error("Supabase client could not be created");
    },
    getFallbackService: () => ({
      listPublicPosts: async () => {
        throw new Error("ENOENT");
      },
      listPublicProjects: async () => [],
    }),
    onFallback: () => {},
  });

  assert.equal(result.source, "none");
  assert.deepEqual(result.posts, []);
  assert.deepEqual(result.projects, []);
});

test("buildRobots blocks admin, auth and api paths and points to the sitemap", async () => {
  const { buildRobots } = await loadSitemapData();

  const robots = buildRobots({ siteUrl: "https://amber.test/" });

  assert.equal(robots.rules.userAgent, "*");
  assert.equal(robots.rules.allow, "/");
  assert.deepEqual(robots.rules.disallow, ["/admin", "/auth", "/api"]);
  assert.equal(robots.sitemap, "https://amber.test/sitemap.xml");
});

test("buildRobots omits the sitemap line when the site URL is unknown", async () => {
  const { buildRobots } = await loadSitemapData();

  const robots = buildRobots({ siteUrl: null });

  assert.deepEqual(robots.rules.disallow, ["/admin", "/auth", "/api"]);
  assert.equal(robots.sitemap, undefined);
});

// 「工作隨筆」下架後的情境：資料表裡還在，但 status 是 draft。假 client 依 eq() 篩選，等同資料庫只回傳符合條件的列。
function createFilteringClient(tables: Record<string, Array<Record<string, unknown>>>) {
  return {
    from(table: string) {
      return {
        select() {
          let rows = [...(tables[table] ?? [])];
          const builder = {
            eq(column: string, value: unknown) {
              rows = rows.filter((row) => row[column] === value);
              return builder;
            },
            maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
            order() {
              return builder;
            },
            then(resolve: (value: { data: typeof rows; error: null }) => unknown) {
              return Promise.resolve({ data: rows, error: null }).then(resolve);
            },
          };
          return builder;
        },
      };
    },
  };
}

test("sitemap built from the Supabase path leaves out a project once it is unpublished", async () => {
  const { buildSitemapEntries, loadSitemapContent } = await loadSitemapData();
  const { SupabaseProjectsRepository } = await import("../lib/infra/repositories/supabase-projects-repository.ts");
  const { createBlogContentService } = await import("../lib/content/service.ts");

  const client = createFilteringClient({
    projects: [
      { featured: true, id: "p1", outcomes: [], project_type: "side", slug: "ai-builder-workflow", sort_order: 1, status: "published", tags: [], title: "A" },
      { featured: true, id: "p3", outcomes: [], project_type: "side", slug: "turning-work-into-thinking", sort_order: 3, status: "draft", tags: [], title: "工作隨筆" },
    ],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects = new SupabaseProjectsRepository(client as any);
  const service = createBlogContentService({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    posts: { listPublishedPosts: async () => [] } as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    projects: projects as any,
  });

  const content = await loadSitemapContent({
    getFallbackService: () => ({ listPublicPosts: async () => [], listPublicProjects: async () => [] }),
    getPrimaryService: () => service,
  });
  const urls = buildSitemapEntries({ ...content, siteUrl: "https://amber.test" }).map((entry) => entry.url);

  assert.equal(content.source, "primary");
  assert.ok(urls.includes("https://amber.test/projects/ai-builder-workflow"));
  assert.ok(!urls.some((url) => url.includes("turning-work-into-thinking")));
});

test("sitemap built from the Markdown fallback leaves out draft projects", async () => {
  const fs = await import("node:fs/promises");
  const os = await import("node:os");
  const path = await import("node:path");
  const { buildSitemapEntries, loadSitemapContent } = await loadSitemapData();
  const { createMarkdownPublicContentRepositories } = await import("../lib/infra/repositories/markdown-public-repositories.ts");

  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "sitemap-projects-"));
  await fs.writeFile(path.join(directory, "kept.md"), "---\ntitle: Kept\ntype: work\n---\n\nBody\n", "utf8");
  await fs.writeFile(path.join(directory, "turning-work-into-thinking.md"), "---\ntitle: 工作隨筆\ntype: side\ndraft: true\n---\n\nBody\n", "utf8");

  const repositories = createMarkdownPublicContentRepositories({ postsDirectory: path.join(directory, "none"), projectsDirectory: directory });
  const content = await loadSitemapContent({
    getFallbackService: () => ({
      listPublicPosts: () => repositories.posts.listPublishedPosts(),
      listPublicProjects: () => repositories.projects.listPublishedProjects(),
    }),
    getPrimaryService: () => {
      throw new Error("Supabase unavailable");
    },
    onFallback: () => {},
  });
  const urls = buildSitemapEntries({ ...content, siteUrl: "https://amber.test" }).map((entry) => entry.url);

  assert.equal(content.source, "fallback");
  assert.ok(urls.includes("https://amber.test/projects/kept"));
  assert.ok(!urls.some((url) => url.includes("turning-work-into-thinking")));
});
