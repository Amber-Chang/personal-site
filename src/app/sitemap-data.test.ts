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
      "https://amber.test/projects",
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
