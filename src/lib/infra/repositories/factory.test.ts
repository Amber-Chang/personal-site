import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("createAdminContentRepositories uses the service-role client for admin reads", async () => {
  const factoryModule = await loadModule<{
    createAdminContentRepositories: (input?: {
      createAdminClient?: () => {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: unknown) => {
              order: (column: string, options: { ascending: boolean }) => Promise<{
                data: unknown[];
                error: null;
              }>;
            };
            order: (column: string, options: { ascending: boolean }) => Promise<{
              data: unknown[];
              error: null;
            }>;
          };
        };
      };
    }) => {
      posts: {
        listAdminPosts: () => Promise<unknown[]>;
      };
      projects: {
        listProjectOptions: () => Promise<unknown[]>;
      };
    };
  }>("./factory.ts", "repository factory");

  const calls: Array<{
    columns: string;
    filters: Array<{ column: string; value: unknown }>;
    table: string;
  }> = [];
  let createAdminClientCalls = 0;

  const repositories = factoryModule.createAdminContentRepositories({
    createAdminClient: () => {
      createAdminClientCalls += 1;

      return {
        from: (table) => ({
          select: (columns) => {
            const call = {
              columns,
              filters: [] as Array<{ column: string; value: unknown }>,
              table,
            };

            calls.push(call);

            return {
              eq: (column, value) => {
                call.filters.push({ column, value });

                return {
                  order: async () => ({
                    data: [],
                    error: null,
                  }),
                };
              },
              order: async () => ({
                data: [],
                error: null,
              }),
            };
          },
        }),
      };
    },
  });

  await repositories.posts.listAdminPosts();
  await repositories.projects.listProjectOptions();

  assert.equal(createAdminClientCalls, 1);
  assert.deepEqual(calls, [
    {
      table: "blog_posts",
      columns: "*",
      filters: [],
    },
    {
      table: "projects",
      columns: "id, slug, title",
      filters: [{ column: "status", value: "published" }],
    },
  ]);
});

test("createPublicContentRepositories uses the anon client for published reads", async () => {
  const factoryModule = await loadModule<{
    createPublicContentRepositories: (input?: {
      createPublicClient?: () => {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: unknown) => {
              order: (column: string, options: { ascending: boolean }) => Promise<{
                data: unknown[];
                error: null;
              }>;
            };
          };
        };
      };
    }) => {
      posts: {
        listPublishedPosts: () => Promise<unknown[]>;
      };
    };
  }>("./factory.ts", "repository factory");

  const calls: Array<{
    columns: string;
    filters: Array<{ column: string; value: unknown }>;
    table: string;
  }> = [];
  let createPublicClientCalls = 0;

  const repositories = factoryModule.createPublicContentRepositories({
    createPublicClient: () => {
      createPublicClientCalls += 1;

      return {
        from: (table) => ({
          select: (columns) => {
            const call = {
              columns,
              filters: [] as Array<{ column: string; value: unknown }>,
              table,
            };

            calls.push(call);

            return {
              eq: (column, value) => {
                call.filters.push({ column, value });

                return {
                  order: async () => ({
                    data: [],
                    error: null,
                  }),
                };
              },
            };
          },
        }),
      };
    },
  });

  await repositories.posts.listPublishedPosts();

  assert.equal(createPublicClientCalls, 1);
  assert.deepEqual(calls, [
    {
      table: "blog_posts",
      columns: "*",
      filters: [{ column: "status", value: "published" }],
    },
  ]);
});
