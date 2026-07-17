import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("createPublicBlogContentService falls back to markdown repositories when Supabase public env is missing", async () => {
  const blogContextModule = await loadModule<{
    createPublicBlogContentService: <TRepositories, TService>(input: {
      createBlogContentService: (repositories: TRepositories) => TService;
      createFallbackPublicContentRepositories: () => TRepositories;
      createPublicContentRepositories: () => TRepositories;
      isMissingPublicContentEnvError: (error: unknown) => boolean;
    }) => TService;
  }>("./blog-context.ts", "blog context");

  const fallbackRepositories = { source: "markdown" };
  let fallbackCalls = 0;

  const service = blogContextModule.createPublicBlogContentService({
    createBlogContentService: (repositories) => repositories,
    createPublicContentRepositories: () => {
      throw new Error("Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL");
    },
    createFallbackPublicContentRepositories: () => {
      fallbackCalls += 1;
      return fallbackRepositories;
    },
    isMissingPublicContentEnvError: (error) =>
      error instanceof Error && error.message === "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL",
  });

  assert.equal(service, fallbackRepositories);
  assert.equal(fallbackCalls, 1);
});

test("createPublicBlogContentService rethrows unexpected repository errors", async () => {
  const blogContextModule = await loadModule<{
    createPublicBlogContentService: <TRepositories, TService>(input: {
      createBlogContentService: (repositories: TRepositories) => TService;
      createFallbackPublicContentRepositories: () => TRepositories;
      createPublicContentRepositories: () => TRepositories;
      isMissingPublicContentEnvError: (error: unknown) => boolean;
    }) => TService;
  }>("./blog-context.ts", "blog context");

  assert.throws(
    () =>
      blogContextModule.createPublicBlogContentService({
        createBlogContentService: (repositories) => repositories,
        createPublicContentRepositories: () => {
          throw new Error("network exploded");
        },
        createFallbackPublicContentRepositories: () => ({ source: "markdown" }),
        isMissingPublicContentEnvError: () => false,
      }),
    /network exploded/,
  );
});
