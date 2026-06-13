import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(path: string, label: string): Promise<TModule> {
  const loadedModule = await import(path).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${path}`);

  return loadedModule as TModule;
}

test("createBlogContentService publishes drafts with the current timestamp", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      now: () => Date;
      posts: {
        getAdminPostById: (id: string) => Promise<{
          id: string;
          status: "draft" | "published";
          publishedAt: string | null;
        } | null>;
        publishPost: (id: string, publishedAt: string) => Promise<{
          id: string;
          status: "draft" | "published";
          publishedAt: string | null;
        }>;
      };
      projects: {
        listProjectOptions: () => Promise<unknown[]>;
      };
    }) => {
      publishPost: (id: string) => Promise<{
        id: string;
        status: "draft" | "published";
        publishedAt: string | null;
      }>;
    };
  }>("./service.ts", "content service");

  const publishCalls: Array<{ id: string; publishedAt: string }> = [];

  const service = serviceModule.createBlogContentService({
    now: () => new Date("2026-06-02T12:34:56.000Z"),
    posts: {
      getAdminPostById: async () => ({
        id: "post-1",
        status: "draft",
        publishedAt: null,
      }),
      publishPost: async (id, publishedAt) => {
        publishCalls.push({ id, publishedAt });

        return {
          id,
          status: "published",
          publishedAt,
        };
      },
    },
    projects: {
      listProjectOptions: async () => [],
    },
  });

  const result = await service.publishPost("post-1");

  assert.deepEqual(publishCalls, [
    {
      id: "post-1",
      publishedAt: "2026-06-02T12:34:56.000Z",
    },
  ]);
  assert.deepEqual(result, {
    id: "post-1",
    status: "published",
    publishedAt: "2026-06-02T12:34:56.000Z",
  });
});

test("createBlogContentService preserves an existing publishedAt timestamp", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      now: () => Date;
      posts: {
        getAdminPostById: (id: string) => Promise<{
          id: string;
          status: "draft" | "published";
          publishedAt: string | null;
        } | null>;
        publishPost: (id: string, publishedAt: string) => Promise<{
          id: string;
          status: "draft" | "published";
          publishedAt: string | null;
        }>;
      };
      projects: {
        listProjectOptions: () => Promise<unknown[]>;
      };
    }) => {
      publishPost: (id: string) => Promise<{
        id: string;
        status: "draft" | "published";
        publishedAt: string | null;
      }>;
    };
  }>("./service.ts", "content service");

  const publishCalls: Array<{ id: string; publishedAt: string }> = [];

  const service = serviceModule.createBlogContentService({
    now: () => new Date("2026-06-02T12:34:56.000Z"),
    posts: {
      getAdminPostById: async () => ({
        id: "post-2",
        status: "published",
        publishedAt: "2026-05-01T00:00:00.000Z",
      }),
      publishPost: async (id, publishedAt) => {
        publishCalls.push({ id, publishedAt });

        return {
          id,
          status: "published",
          publishedAt,
        };
      },
    },
    projects: {
      listProjectOptions: async () => [],
    },
  });

  const result = await service.publishPost("post-2");

  assert.deepEqual(publishCalls, [
    {
      id: "post-2",
      publishedAt: "2026-05-01T00:00:00.000Z",
    },
  ]);
  assert.deepEqual(result, {
    id: "post-2",
    status: "published",
    publishedAt: "2026-05-01T00:00:00.000Z",
  });
});

test("SupabaseBlogPostsRepository scopes public reads to published posts", async () => {
  const repositoryModule = await loadModule<{
    SupabaseBlogPostsRepository: new (client: {
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
    }) => {
      listPublishedPosts: () => Promise<unknown[]>;
    };
  }>("../infra/repositories/supabase-posts-repository.ts", "Supabase posts repository");

  const calls: Array<{
    columns: string;
    filters: Array<{ column: string; value: unknown }>;
    orders: Array<{ column: string; ascending: boolean }>;
    table: string;
  }> = [];

  const repository = new repositoryModule.SupabaseBlogPostsRepository({
    from: (table) => ({
      select: (columns) => {
        const call = {
          columns,
          filters: [] as Array<{ column: string; value: unknown }>,
          orders: [] as Array<{ column: string; ascending: boolean }>,
          table,
        };

        calls.push(call);

        return {
          eq: (column, value) => {
            call.filters.push({ column, value });

            return {
              order: (orderColumn, options) => {
                call.orders.push({
                  column: orderColumn,
                  ascending: options.ascending,
                });

                return {
                  order: async (nestedOrderColumn: string, nestedOptions: { ascending: boolean }) => {
                    call.orders.push({
                      column: nestedOrderColumn,
                      ascending: nestedOptions.ascending,
                    });

                    return {
                      data: [],
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      },
    }),
  });

  const result = await repository.listPublishedPosts();

  assert.deepEqual(result, []);
  assert.deepEqual(calls, [
    {
      table: "blog_posts",
      columns: "*",
      filters: [{ column: "status", value: "published" }],
      orders: [
        { column: "sort_order", ascending: true },
        { column: "updated_at", ascending: false },
      ],
    },
  ]);
});

test("SupabaseBlogPostsRepository lists admin posts ordered by sort order", async () => {
  const repositoryModule = await loadModule<{
    SupabaseBlogPostsRepository: new (client: {
      from: (table: string) => {
        select: (columns: string) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{
            data: unknown[];
            error: null;
          }>;
        };
      };
    }) => {
      listAdminPosts: () => Promise<unknown[]>;
    };
  }>("../infra/repositories/supabase-posts-repository.ts", "Supabase posts repository");

  const calls: Array<{
    columns: string;
    orders: Array<{ ascending: boolean; column: string }>;
    table: string;
  }> = [];

  const repository = new repositoryModule.SupabaseBlogPostsRepository({
    from: (table) => ({
      select: (columns) => {
        const call = {
          columns,
          orders: [] as Array<{ ascending: boolean; column: string }>,
          table,
        };

        calls.push(call);

        return {
          order: (orderColumn, options) => {
            call.orders.push({
              ascending: options.ascending,
              column: orderColumn,
            });

            return {
              order: async (nestedOrderColumn: string, nestedOptions: { ascending: boolean }) => {
                call.orders.push({
                  ascending: nestedOptions.ascending,
                  column: nestedOrderColumn,
                });

                return {
                  data: [],
                  error: null,
                };
              },
            };
          },
        };
      },
    }),
  });

  const result = await repository.listAdminPosts();

  assert.deepEqual(result, []);
  assert.deepEqual(calls, [
    {
      table: "blog_posts",
      columns: "*",
      orders: [
        { ascending: true, column: "sort_order" },
        { ascending: false, column: "updated_at" },
      ],
    },
  ]);
});

test("SupabaseBlogPostsRepository deletes a post by id", async () => {
  const repositoryModule = await loadModule<{
    SupabaseBlogPostsRepository: new (client: {
      from: (table: string) => {
        delete: () => {
          eq: (column: string, value: unknown) => Promise<{ error: null }>;
        };
      };
    }) => {
      deletePost: (id: string) => Promise<void>;
    };
  }>("../infra/repositories/supabase-posts-repository.ts", "Supabase posts repository");

  const calls: Array<{
    column: string;
    table: string;
    value: unknown;
  }> = [];

  const repository = new repositoryModule.SupabaseBlogPostsRepository({
    from: (table) => ({
      delete: () => ({
        eq: async (column, value) => {
          calls.push({ column, table, value });

          return { error: null };
        },
      }),
    }),
  });

  await repository.deletePost("post-1");

  assert.deepEqual(calls, [
    {
      table: "blog_posts",
      column: "id",
      value: "post-1",
    },
  ]);
});

test("SupabaseBlogPostsRepository reorders posts with a single batch write", async () => {
  const repositoryModule = await loadModule<{
    SupabaseBlogPostsRepository: new (client: {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: null }>;
    }) => {
      reorderPosts: (idsInOrder: string[]) => Promise<void>;
    };
  }>("../infra/repositories/supabase-posts-repository.ts", "Supabase posts repository");

  const calls: Array<{
    args: Record<string, unknown>;
    fn: string;
  }> = [];

  const repository = new repositoryModule.SupabaseBlogPostsRepository({
    rpc: async (fn, args) => {
      calls.push({ args, fn });

      return { error: null };
    },
  });

  await repository.reorderPosts(["post-3", "post-1", "post-2"]);

  assert.deepEqual(calls, [
    {
      fn: "reorder_blog_posts",
      args: {
        ids_in_order: ["post-3", "post-1", "post-2"],
      },
    },
  ]);
});

test("SupabaseBlogPostsRepository scopes related post reads to published posts for a project", async () => {
  const repositoryModule = await loadModule<{
    SupabaseBlogPostsRepository: new (client: {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: unknown) => {
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
      listPublishedPostsByProjectId: (projectId: string) => Promise<unknown[]>;
    };
  }>("../infra/repositories/supabase-posts-repository.ts", "Supabase posts repository");

  const calls: Array<{
    columns: string;
    filters: Array<{ column: string; value: unknown }>;
    orders: Array<{ column: string; ascending: boolean }>;
    table: string;
  }> = [];

  const repository = new repositoryModule.SupabaseBlogPostsRepository({
    from: (table) => ({
      select: (columns) => {
        const call = {
          columns,
          filters: [] as Array<{ column: string; value: unknown }>,
          orders: [] as Array<{ column: string; ascending: boolean }>,
          table,
        };

        calls.push(call);

        return {
          eq: (column, value) => {
            call.filters.push({ column, value });

            return {
              eq: (nestedColumn, nestedValue) => {
                call.filters.push({ column: nestedColumn, value: nestedValue });

                return {
                  order: (orderColumn, options) => {
                    call.orders.push({
                      column: orderColumn,
                      ascending: options.ascending,
                    });

                    return {
                      order: async (nestedOrderColumn: string, nestedOptions: { ascending: boolean }) => {
                        call.orders.push({
                          column: nestedOrderColumn,
                          ascending: nestedOptions.ascending,
                        });

                        return {
                          data: [],
                          error: null,
                        };
                      },
                    };
                  },
                };
              },
            };
          },
        };
      },
    }),
  });

  const result = await repository.listPublishedPostsByProjectId("project-1");

  assert.deepEqual(result, []);
  assert.deepEqual(calls, [
    {
      table: "blog_posts",
      columns: "*",
      filters: [
        { column: "related_project_id", value: "project-1" },
        { column: "status", value: "published" },
      ],
      orders: [
        { column: "sort_order", ascending: true },
        { column: "updated_at", ascending: false },
      ],
    },
  ]);
});

test("SupabaseProjectsRepository returns published project options ordered by title", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (client: {
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
    }) => {
      listProjectOptions: () => Promise<unknown[]>;
    };
  }>("../infra/repositories/supabase-projects-repository.ts", "Supabase projects repository");

  const calls: Array<{
    columns: string;
    filters: Array<{ column: string; value: unknown }>;
    order: { column: string; ascending: boolean } | null;
    table: string;
  }> = [];

  const repository = new repositoryModule.SupabaseProjectsRepository({
    from: (table) => ({
      select: (columns) => {
        const call = {
          columns,
          filters: [] as Array<{ column: string; value: unknown }>,
          order: null as { column: string; ascending: boolean } | null,
          table,
        };

        calls.push(call);

        return {
          eq: (column, value) => {
            call.filters.push({ column, value });

            return {
              order: async (orderColumn, options) => {
                call.order = {
                  column: orderColumn,
                  ascending: options.ascending,
                };

                return {
                  data: [],
                  error: null,
                };
              },
            };
          },
        };
      },
    }),
  });

  const result = await repository.listProjectOptions();

  assert.deepEqual(result, []);
  assert.deepEqual(calls, [
    {
      table: "projects",
      columns: "id, slug, title",
      filters: [{ column: "status", value: "published" }],
      order: { column: "title", ascending: true },
    },
  ]);
});

test("SupabaseProjectsRepository lists admin projects with sync fields", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (client: {
      from: (table: string) => {
        select: (columns: string) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{
            data: unknown[];
            error: null;
          }>;
        };
      };
    }) => {
      listAdminProjects: () => Promise<unknown[]>;
    };
  }>("../infra/repositories/supabase-projects-repository.ts", "Supabase projects repository");

  const calls: Array<{
    columns: string;
    orders: Array<{ column: string; ascending: boolean }>;
    table: string;
  }> = [];

  const repository = new repositoryModule.SupabaseProjectsRepository({
    from: (table) => ({
      select: (columns) => {
        const call = {
          columns,
          orders: [] as Array<{ column: string; ascending: boolean }>,
          table,
        };

        calls.push(call);

        return {
          order: (orderColumn, options) => {
            call.orders.push({
              column: orderColumn,
              ascending: options.ascending,
            });

            return {
              order: async (nestedOrderColumn: string, nestedOptions: { ascending: boolean }) => {
                call.orders.push({
                  column: nestedOrderColumn,
                  ascending: nestedOptions.ascending,
                });

                return {
                  data: [],
                  error: null,
                };
              },
            };
          },
        };
      },
    }),
  });

  const result = await repository.listAdminProjects();

  assert.deepEqual(result, []);
  assert.deepEqual(calls, [
    {
      table: "projects",
      columns: "*",
      orders: [
        { column: "sort_order", ascending: true },
        { column: "updated_at", ascending: false },
      ],
    },
  ]);
});

test("SupabaseProjectsRepository deletes a project by id", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (client: {
      from: (table: string) => {
        delete: () => {
          eq: (column: string, value: unknown) => Promise<{ error: null }>;
        };
      };
    }) => {
      deleteProject: (id: string) => Promise<void>;
    };
  }>("../infra/repositories/supabase-projects-repository.ts", "Supabase projects repository");

  const calls: Array<{
    column: string;
    table: string;
    value: unknown;
  }> = [];

  const repository = new repositoryModule.SupabaseProjectsRepository({
    from: (table) => ({
      delete: () => ({
        eq: async (column, value) => {
          calls.push({ column, table, value });

          return { error: null };
        },
      }),
    }),
  });

  await repository.deleteProject("project-1");

  assert.deepEqual(calls, [
    {
      table: "projects",
      column: "id",
      value: "project-1",
    },
  ]);
});

test("SupabaseProjectsRepository reorders projects with a single batch write", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (client: {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: null }>;
    }) => {
      reorderProjects: (idsInOrder: string[]) => Promise<void>;
    };
  }>("../infra/repositories/supabase-projects-repository.ts", "Supabase projects repository");

  const calls: Array<{
    args: Record<string, unknown>;
    fn: string;
  }> = [];

  const repository = new repositoryModule.SupabaseProjectsRepository({
    rpc: async (fn, args) => {
      calls.push({ args, fn });

      return { error: null };
    },
  });

  await repository.reorderProjects(["project-2", "project-3", "project-1"]);

  assert.deepEqual(calls, [
    {
      fn: "reorder_projects",
      args: {
        ids_in_order: ["project-2", "project-3", "project-1"],
      },
    },
  ]);
});

test("SupabaseProjectsRepository gets an admin project by id", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (client: {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: unknown) => {
            maybeSingle: () => Promise<{
              data: {
                content_markdown: string | null;
                created_at: string;
                id: string;
                published_at: string | null;
                slug: string;
                status: "draft" | "published";
                summary: string | null;
                title: string;
                updated_at: string;
              } | null;
              error: null;
            }>;
          };
        };
      };
    }) => {
      getAdminProjectById: (id: string) => Promise<unknown>;
    };
  }>("../infra/repositories/supabase-projects-repository.ts", "Supabase projects repository");

  const repository = new repositoryModule.SupabaseProjectsRepository({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
              data: {
                content_markdown: null,
                created_at: "2026-06-09T00:00:00.000Z",
                featured: false,
                id: "project-1",
                outcomes: [],
                period: null,
                published_at: null,
                role: null,
                sort_order: 3,
                slug: "sample-project",
                status: "draft",
                summary: "Project summary",
                tags: [],
                title: "Sample project",
                updated_at: "2026-06-09T00:00:00.000Z",
              },
            error: null,
          }),
        }),
      }),
    }),
  });

  const result = await repository.getAdminProjectById("project-1");

  assert.deepEqual(result, {
    contentMarkdown: null,
    createdAt: "2026-06-09T00:00:00.000Z",
    featured: false,
    id: "project-1",
    outcomes: [],
    period: null,
    publishedAt: null,
    role: null,
    sortOrder: 3,
    slug: "sample-project",
    status: "draft",
    summary: "Project summary",
    tags: [],
    title: "Sample project",
    updatedAt: "2026-06-09T00:00:00.000Z",
  });
});

test("SupabaseProjectsRepository creates and updates admin project identities", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (client: {
      from: (table: string) => {
        insert: (values: Record<string, unknown>) => {
          select: (columns: string) => {
            single: () => Promise<{
              data: {
                content_markdown: string | null;
                created_at: string;
                id: string;
                published_at: string | null;
                slug: string;
                status: "draft" | "published";
                summary: string | null;
                title: string;
                updated_at: string;
              } | null;
              error: null;
            }>;
          };
        };
        update: (values: Record<string, unknown>) => {
          eq: (column: string, value: unknown) => {
            select: (columns: string) => {
              single: () => Promise<{
                data: {
                  content_markdown: string | null;
                  created_at: string;
                  id: string;
                  published_at: string | null;
                  slug: string;
                  status: "draft" | "published";
                  summary: string | null;
                  title: string;
                  updated_at: string;
                } | null;
                error: null;
              }>;
            };
          };
        };
        select: (columns: string) => {
          order: (column: string, options: { ascending: boolean }) => Promise<{ data: []; error: null }>;
        };
      };
    }) => {
      createProject: (input: {
        slug: string;
        status?: "draft" | "published";
        summary?: string | null;
        title: string;
      }) => Promise<unknown>;
      updateProject: (id: string, input: {
        slug?: string;
        status?: "draft" | "published";
        summary?: string | null;
        title?: string;
      }) => Promise<unknown>;
    };
  }>("../infra/repositories/supabase-projects-repository.ts", "Supabase projects repository");

  const insertCalls: Record<string, unknown>[] = [];
  const updateCalls: Array<{ id: unknown; values: Record<string, unknown> }> = [];

  const repository = new repositoryModule.SupabaseProjectsRepository({
    from: () => ({
      insert: (values) => {
        insertCalls.push(values);
        return {
          select: () => ({
            single: async () => ({
              data: {
                content_markdown: null,
                created_at: "2026-06-09T00:00:00.000Z",
                featured: false,
                id: "project-created",
                outcomes: [],
                period: null,
                published_at: null,
                role: null,
                sort_order: 9,
                slug: "new-project",
                status: "published",
                summary: "New summary",
                tags: [],
                title: "New project",
                updated_at: "2026-06-09T00:00:00.000Z",
              },
              error: null,
            }),
          }),
        };
      },
      select: () => ({
        order: async () => ({
          data: [],
          error: null,
        }),
      }),
      update: (values) => ({
        eq: (_column, value) => {
          updateCalls.push({ id: value, values });
          return {
            select: () => ({
              single: async () => ({
                data: {
                  content_markdown: null,
                  created_at: "2026-06-09T00:00:00.000Z",
                  featured: false,
                  id: "project-created",
                  outcomes: [],
                  period: null,
                  published_at: null,
                  role: null,
                  sort_order: 4,
                  slug: "updated-project",
                  status: "draft",
                  summary: "Updated summary",
                  tags: [],
                  title: "Updated project",
                  updated_at: "2026-06-09T00:10:00.000Z",
                },
                error: null,
              }),
            }),
          };
        },
      }),
    }),
  });

  const created = await repository.createProject({
    slug: "new-project",
    status: "published",
    summary: "New summary",
    title: "New project",
  });
  const updated = await repository.updateProject("project-created", {
    slug: "updated-project",
    status: "draft",
    summary: "Updated summary",
    title: "Updated project",
  });

  assert.deepEqual(insertCalls, [
    {
      content_markdown: null,
      featured: false,
      outcomes: [],
      period: null,
      role: null,
      sort_order: 2147483647,
      slug: "new-project",
      status: "published",
      summary: "New summary",
      tags: [],
      title: "New project",
    },
  ]);
  assert.deepEqual(updateCalls, [
    {
      id: "project-created",
      values: {
        slug: "updated-project",
        status: "draft",
        summary: "Updated summary",
        title: "Updated project",
      },
    },
  ]);
  assert.equal((created as { id: string }).id, "project-created");
  assert.equal((updated as { slug: string }).slug, "updated-project");
});

test("SupabaseProjectsRepository upserts project identities by slug without resetting existing sort order", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (client: {
      from: (table: string) => {
        upsert: (
          values: Record<string, unknown>,
          options: { onConflict: string },
        ) => {
          select: (columns: string) => {
            maybeSingle: () => Promise<{
              data: {
                id: string;
                slug: string;
                title: string;
                summary: string | null;
                content_markdown: string | null;
                status: "draft" | "published";
                published_at: string | null;
                created_at: string;
                updated_at: string;
              } | null;
              error: null;
            }>;
          };
        };
      };
    }) => {
      upsertProject: (input: {
        contentMarkdown: string | null;
        publishedAt: string | null;
        slug: string;
        status: "draft" | "published";
        summary: string | null;
        title: string;
      }) => Promise<unknown>;
    };
  }>("../infra/repositories/supabase-projects-repository.ts", "Supabase projects repository");

  const calls: Array<{
    onConflict: string;
    table: string;
    values: Record<string, unknown>;
  }> = [];

  const repository = new repositoryModule.SupabaseProjectsRepository({
    from: (table) => ({
      upsert: (values, options) => {
        calls.push({
          onConflict: options.onConflict,
          table,
          values,
        });

        return {
          select: () => ({
            maybeSingle: async () => ({
              data: {
                content_markdown: "Project body",
                created_at: "2026-06-09T00:00:00.000Z",
                featured: false,
                id: "project-1",
                outcomes: [],
                period: null,
                published_at: null,
                role: null,
                sort_order: 8,
                slug: "sms-management-platform",
                status: "published",
                summary: "Project summary",
                tags: [],
                title: "SMS Management Platform",
                updated_at: "2026-06-09T00:00:00.000Z",
              },
              error: null,
            }),
          }),
        };
      },
    }),
  });

  const result = await repository.upsertProject({
    contentMarkdown: "Project body",
    publishedAt: null,
    slug: "sms-management-platform",
    status: "published",
    summary: "Project summary",
    title: "SMS Management Platform",
  });

  assert.deepEqual(calls, [
    {
      onConflict: "slug",
      table: "projects",
      values: {
        content_markdown: "Project body",
        featured: false,
        outcomes: [],
        period: null,
        published_at: null,
        role: null,
        slug: "sms-management-platform",
        status: "published",
        summary: "Project summary",
        tags: [],
        title: "SMS Management Platform",
      },
    },
  ]);
  assert.deepEqual(result, {
    contentMarkdown: "Project body",
    createdAt: "2026-06-09T00:00:00.000Z",
    featured: false,
    id: "project-1",
    outcomes: [],
    period: null,
    publishedAt: null,
    role: null,
    sortOrder: 8,
    slug: "sms-management-platform",
    status: "published",
    summary: "Project summary",
    tags: [],
    title: "SMS Management Platform",
    updatedAt: "2026-06-09T00:00:00.000Z",
  });
});

test("SupabaseProjectsRepository lists published public projects with stable fallback ordering", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (client: {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: unknown) => {
            order: (column: string, options: { ascending: boolean }) => {
              order: (column: string, options: { ascending: boolean }) => Promise<{
                data: unknown[];
                error: null;
              }>;
            };
          };
        };
      };
    }) => {
      listPublishedProjects: () => Promise<unknown[]>;
    };
  }>("../infra/repositories/supabase-projects-repository.ts", "Supabase projects repository");

  const calls: Array<{
    columns: string;
    filters: Array<{ column: string; value: unknown }>;
    orders: Array<{ ascending: boolean; column: string }>;
    table: string;
  }> = [];

  const repository = new repositoryModule.SupabaseProjectsRepository({
    from: (table) => ({
      select: (columns) => {
        const call = {
          columns,
          filters: [] as Array<{ column: string; value: unknown }>,
          orders: [] as Array<{ ascending: boolean; column: string }>,
          table,
        };

        calls.push(call);

        return {
          eq: (column, value) => {
            call.filters.push({ column, value });

            return {
              order: (orderColumn, options) => {
                call.orders.push({
                  ascending: options.ascending,
                  column: orderColumn,
                });

                return {
                  order: async (nestedOrderColumn: string, nestedOptions: { ascending: boolean }) => {
                    call.orders.push({
                      ascending: nestedOptions.ascending,
                      column: nestedOrderColumn,
                    });

                    return {
                      data: [],
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      },
    }),
  });

  const result = await repository.listPublishedProjects();

  assert.deepEqual(result, []);
  assert.deepEqual(calls, [
    {
      table: "projects",
      columns: "id, slug, title, summary, role, period, tags, outcomes, featured, published_at, status",
      filters: [{ column: "status", value: "published" }],
      orders: [
        { ascending: true, column: "sort_order" },
        { ascending: false, column: "updated_at" },
      ],
    },
  ]);
});

test("SupabaseProjectsRepository resolves a public project by slug with Supabase-backed content", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (client: {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: unknown) => {
            eq: (column: string, value: unknown) => {
              maybeSingle: () => Promise<{
                data: {
                  content_markdown: string | null;
                  featured: boolean | null;
                  id: string;
                  outcomes: string[] | null;
                  period: string | null;
                  published_at: string | null;
                  role: string | null;
                  slug: string;
                  status: "draft" | "published";
                  summary: string | null;
                  tags: string[] | null;
                  title: string;
                } | null;
                error: null;
              }>;
            };
          };
        };
      };
    }) => {
      getPublicProjectBySlug: (slug: string) => Promise<{
        content: string;
        featured: boolean;
        id: string;
        outcomes: string[];
        period: string;
        role: string;
        slug: string;
        summary: string;
        tags: string[];
        title: string;
      } | null>;
    };
  }>("../infra/repositories/supabase-projects-repository.ts", "Supabase projects repository");

  const calls: Array<{
    columns: string;
    filters: Array<{ column: string; value: unknown }>;
    table: string;
  }> = [];

  const repository = new repositoryModule.SupabaseProjectsRepository({
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
              eq: (nestedColumn, nestedValue) => {
                call.filters.push({ column: nestedColumn, value: nestedValue });

                return {
                  maybeSingle: async () => ({
                    data: {
                      content_markdown: "專案內容",
                      featured: true,
                      id: "project-1",
                      outcomes: ["把需求整理成可執行流程"],
                      period: "2025",
                      published_at: "2026-06-09T00:00:00.000Z",
                      role: "PM",
                      slug: "sms-management-platform",
                      status: "published",
                      summary: "把分散需求產品化。",
                      tags: ["產品策略"],
                      title: "簡訊管理平台",
                    },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      },
    }),
  });

  const result = await repository.getPublicProjectBySlug("sms-management-platform");

  assert.deepEqual(result, {
    content: "專案內容",
    featured: true,
    id: "project-1",
    outcomes: ["把需求整理成可執行流程"],
    period: "2025",
    role: "PM",
    slug: "sms-management-platform",
    summary: "把分散需求產品化。",
    tags: ["產品策略"],
    title: "簡訊管理平台",
  });
  assert.deepEqual(calls, [
    {
      table: "projects",
      columns: "id, slug, title, summary, role, period, tags, outcomes, featured, content_markdown, published_at, status",
      filters: [
        { column: "slug", value: "sms-management-platform" },
        { column: "status", value: "published" },
      ],
    },
  ]);
});

test("SupabaseProjectsRepository lists published public projects with full card fields from Supabase", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (client: {
      from: (table: string) => {
        select: (columns: string) => {
          eq: (column: string, value: unknown) => {
            order: (column: string, options: { ascending: boolean }) => Promise<{
              data: Array<{
                featured: boolean;
                id: string;
                outcomes: string[] | null;
                period: string | null;
                published_at: string | null;
                role: string | null;
                slug: string;
                status: "draft" | "published";
                summary: string | null;
                tags: string[] | null;
                title: string;
              }>;
              error: null;
            }>;
          };
        };
      };
    }) => {
      listPublishedProjects: () => Promise<
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
  }>("../infra/repositories/supabase-projects-repository.ts", "Supabase projects repository");

  const calls: Array<{
    columns: string;
    filters: Array<{ column: string; value: unknown }>;
    orders: Array<{ ascending: boolean; column: string }>;
    table: string;
  }> = [];

  const repository = new repositoryModule.SupabaseProjectsRepository({
    from: (table) => ({
      select: (columns) => {
        const call = {
          columns,
          filters: [] as Array<{ column: string; value: unknown }>,
          orders: [] as Array<{ ascending: boolean; column: string }>,
          table,
        };

        calls.push(call);

        return {
          eq: (column, value) => {
            call.filters.push({ column, value });

            return {
              order: (orderColumn, options) => {
                call.orders.push({
                  ascending: options.ascending,
                  column: orderColumn,
                });

                return {
                  order: async (nestedOrderColumn: string, nestedOptions: { ascending: boolean }) => {
                    call.orders.push({
                      ascending: nestedOptions.ascending,
                      column: nestedOrderColumn,
                    });

                    return {
                      data: [
                        {
                          featured: true,
                          id: "project-1",
                          outcomes: ["把需求整理成可執行流程"],
                          period: "2025",
                          published_at: "2026-06-09T00:00:00.000Z",
                          role: "PM",
                          slug: "sms-management-platform",
                          status: "published",
                          summary: "把分散需求產品化。",
                          tags: ["產品策略"],
                          title: "簡訊管理平台",
                        },
                      ],
                      error: null,
                    };
                  },
                };
              },
            };
          },
        };
      },
    }),
  });

  const result = await repository.listPublishedProjects();

  assert.deepEqual(result, [
    {
      featured: true,
      id: "project-1",
      outcomes: ["把需求整理成可執行流程"],
      period: "2025",
      role: "PM",
      slug: "sms-management-platform",
      summary: "把分散需求產品化。",
      tags: ["產品策略"],
      title: "簡訊管理平台",
    },
  ]);
  assert.deepEqual(calls, [
    {
      table: "projects",
      columns: "id, slug, title, summary, role, period, tags, outcomes, featured, published_at, status",
      filters: [{ column: "status", value: "published" }],
      orders: [
        { ascending: true, column: "sort_order" },
        { ascending: false, column: "updated_at" },
      ],
    },
  ]);
});

test("SupabaseBlogPostsRepository translates duplicate slug errors into helper copy", async () => {
  const repositoryModule = await loadModule<{
    SupabaseBlogPostsRepository: new (client: {
      from: (table: string) => {
        insert: (input: Record<string, unknown>) => {
          select: (columns: string) => {
            single: () => Promise<{
              data: null;
              error: {
                code: string;
                details?: string;
                message?: string;
              };
            }>;
          };
        };
      };
    }) => {
      createPost: (input: {
        contentMarkdown: string;
        excerpt: string | null;
        publishedAt?: string | null;
        relatedProjectId?: string | null;
        slug: string;
        status: "draft" | "published";
        title: string;
      }) => Promise<unknown>;
    };
  }>("../infra/repositories/supabase-posts-repository.ts", "Supabase posts repository");

  const repository = new repositoryModule.SupabaseBlogPostsRepository({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: async () => ({
            data: null,
            error: {
              code: "23505",
              details: "Key (slug)=(ai-membership-system) already exists.",
              message: 'duplicate key value violates unique constraint "blog_posts_slug_key"',
            },
          }),
        }),
      }),
    }),
  });

  await assert.rejects(
    () =>
      repository.createPost({
        contentMarkdown: "",
        excerpt: null,
        relatedProjectId: null,
        slug: "ai-membership-system",
        status: "draft",
        title: "Duplicate slug",
      }),
    (error: unknown) => error instanceof Error && error.message === "這個 slug 已經被其他文章使用，請換一個網址識別字。",
  );
});

test("createBlogContentService lists admin posts through the repository", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        getAdminPostById: (id: string) => Promise<null>;
        listAdminPosts: () => Promise<Array<{ id: string; title: string }>>;
        listPublishedPosts: () => Promise<unknown[]>;
        publishPost: (id: string, publishedAt: string) => Promise<unknown>;
        getPublishedPostBySlug: (slug: string) => Promise<unknown>;
      };
      projects: {
        listProjectOptions: () => Promise<unknown[]>;
      };
    }) => {
      listAdminPosts: () => Promise<Array<{ id: string; title: string }>>;
    };
  }>("./service.ts", "content service");

  const calls: string[] = [];
  const posts = [{ id: "post-1", title: "Admin post" }];

  const service = serviceModule.createBlogContentService({
    posts: {
      getAdminPostById: async () => null,
      listAdminPosts: async () => {
        calls.push("listAdminPosts");
        return posts;
      },
      listPublishedPosts: async () => [],
      publishPost: async () => {
        throw new Error("publishPost should not be called");
      },
      getPublishedPostBySlug: async () => null,
    },
    projects: {
      listProjectOptions: async () => [],
    },
  });

  const result = await service.listAdminPosts();

  assert.deepEqual(calls, ["listAdminPosts"]);
  assert.deepEqual(result, posts);
});

test("createBlogContentService lists related published posts for a project through the repository", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        getAdminPostById: (id: string) => Promise<null>;
        getPublishedPostBySlug: (slug: string) => Promise<null>;
        listAdminPosts: () => Promise<unknown[]>;
        listPublishedPosts: () => Promise<unknown[]>;
        listPublishedPostsByProjectId: (projectId: string) => Promise<Array<{ id: string; title: string }>>;
        publishPost: (id: string, publishedAt: string) => Promise<unknown>;
        updatePost: (id: string, input: unknown) => Promise<unknown>;
      };
      projects: {
        getProjectById: (id: string) => Promise<null>;
        getPublicProjectById: (id: string) => Promise<null>;
        getPublicProjectBySlug: (slug: string) => Promise<null>;
        listProjectOptions: () => Promise<unknown[]>;
      };
    }) => {
      listPostsByProjectId: (projectId: string) => Promise<Array<{ id: string; title: string }>>;
    };
  }>("./service.ts", "content service");

  const calls: string[] = [];
  const posts = [{ id: "post-1", title: "Published post" }];

  const service = serviceModule.createBlogContentService({
    posts: {
      getAdminPostById: async () => null,
      getPublishedPostBySlug: async () => null,
      listAdminPosts: async () => [],
      listPublishedPosts: async () => [],
      listPublishedPostsByProjectId: async (projectId) => {
        calls.push(projectId);
        return posts;
      },
      publishPost: async () => {
        throw new Error("publishPost should not be called");
      },
      updatePost: async () => {
        throw new Error("updatePost should not be called");
      },
    },
    projects: {
      getProjectById: async () => null,
      getPublicProjectById: async () => null,
      getPublicProjectBySlug: async () => null,
      listProjectOptions: async () => [],
    },
  });

  const result = await service.listPostsByProjectId("project-1");

  assert.deepEqual(calls, ["project-1"]);
  assert.deepEqual(result, posts);
});

test("createBlogContentService returns a public project by slug through the repository", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        createPost: (input: unknown) => Promise<unknown>;
        getAdminPostById: (id: string) => Promise<null>;
        getPublishedPostBySlug: (slug: string) => Promise<null>;
        listAdminPosts: () => Promise<unknown[]>;
        listPublishedPosts: () => Promise<unknown[]>;
        listPublishedPostsByProjectId: (projectId: string) => Promise<unknown[]>;
        publishPost: (id: string, publishedAt: string) => Promise<unknown>;
        updatePost: (id: string, input: unknown) => Promise<unknown>;
      };
      projects: {
        getProjectById: (id: string) => Promise<null>;
        getPublicProjectById: (id: string) => Promise<null>;
        getPublicProjectBySlug: (slug: string) => Promise<{
          content: string;
          id: string | null;
          slug: string;
          summary: string;
          title: string;
        } | null>;
        listProjectOptions: () => Promise<unknown[]>;
      };
    }) => {
      getPublicProjectBySlug: (slug: string) => Promise<{
        content: string;
        id: string | null;
        slug: string;
        summary: string;
        title: string;
      } | null>;
    };
  }>("./service.ts", "content service");

  const calls: string[] = [];

  const service = serviceModule.createBlogContentService({
    posts: {
      createPost: async () => {
        throw new Error("createPost should not be called");
      },
      getAdminPostById: async () => null,
      getPublishedPostBySlug: async () => null,
      listAdminPosts: async () => [],
      listPublishedPosts: async () => [],
      listPublishedPostsByProjectId: async () => [],
      publishPost: async () => {
        throw new Error("publishPost should not be called");
      },
      updatePost: async () => {
        throw new Error("updatePost should not be called");
      },
    },
    projects: {
      getProjectById: async () => null,
      getPublicProjectById: async () => null,
      getPublicProjectBySlug: async (slug) => {
        calls.push(slug);

        return {
          content: "專案內容",
          id: "project-1",
          slug,
          summary: "把分散需求產品化。",
          title: "簡訊管理平台",
        };
      },
      listProjectOptions: async () => [],
    },
  });

  const result = await service.getPublicProjectBySlug("sms-management-platform");

  assert.deepEqual(calls, ["sms-management-platform"]);
  assert.deepEqual(result, {
    content: "專案內容",
    id: "project-1",
    slug: "sms-management-platform",
    summary: "把分散需求產品化。",
    title: "簡訊管理平台",
  });
});

test("createBlogContentService lists public projects through the repository", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        listAdminPosts: () => Promise<unknown[]>;
      };
      projects: {
        listProjectOptions: () => Promise<unknown[]>;
        listPublishedProjects: () => Promise<Array<{ slug: string; title: string }>>;
      };
    }) => {
      listPublicProjects: () => Promise<Array<{ slug: string; title: string }>>;
    };
  }>("./service.ts", "content service");

  const calls: string[] = [];
  const projects = [{ slug: "sms-management-platform", title: "簡訊管理平台" }];

  const service = serviceModule.createBlogContentService({
    posts: {
      listAdminPosts: async () => [],
    },
    projects: {
      listProjectOptions: async () => [],
      listPublishedProjects: async () => {
        calls.push("listPublishedProjects");
        return projects;
      },
    },
  });

  const result = await service.listPublicProjects();

  assert.deepEqual(calls, ["listPublishedProjects"]);
  assert.deepEqual(result, projects);
});

test("createBlogContentService lists featured public projects through the repository", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        listAdminPosts: () => Promise<unknown[]>;
      };
      projects: {
        listFeaturedProjects: () => Promise<Array<{ slug: string; title: string }>>;
        listProjectOptions: () => Promise<unknown[]>;
      };
    }) => {
      listFeaturedProjects: () => Promise<Array<{ slug: string; title: string }>>;
    };
  }>("./service.ts", "content service");

  const calls: string[] = [];
  const projects = [{ slug: "sms-management-platform", title: "簡訊管理平台" }];

  const service = serviceModule.createBlogContentService({
    posts: {
      listAdminPosts: async () => [],
    },
    projects: {
      listFeaturedProjects: async () => {
        calls.push("listFeaturedProjects");
        return projects;
      },
      listProjectOptions: async () => [],
    },
  });

  const result = await service.listFeaturedProjects();

  assert.deepEqual(calls, ["listFeaturedProjects"]);
  assert.deepEqual(result, projects);
});

test("createBlogContentService delegates admin project sync reads and writes through the repository", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        listAdminPosts: () => Promise<unknown[]>;
      };
      projects: {
        getProjectById: (id: string) => Promise<null>;
        getPublicProjectById: (id: string) => Promise<null>;
        getPublicProjectBySlug: (slug: string) => Promise<null>;
        listAdminProjects: () => Promise<Array<{ slug: string }>>;
        listProjectOptions: () => Promise<unknown[]>;
        upsertProject: (input: {
          contentMarkdown: string | null;
          publishedAt: string | null;
          slug: string;
          status: "draft" | "published";
          summary: string | null;
          title: string;
        }) => Promise<{ slug: string }>;
      };
    }) => {
      listAdminProjects: () => Promise<Array<{ slug: string }>>;
      upsertProject: (input: {
        contentMarkdown: string | null;
        publishedAt: string | null;
        slug: string;
        status: "draft" | "published";
        summary: string | null;
        title: string;
      }) => Promise<{ slug: string }>;
    };
  }>("./service.ts", "content service");

  const upsertCalls: Array<{ slug: string; status: "draft" | "published" }> = [];

  const service = serviceModule.createBlogContentService({
    posts: {
      listAdminPosts: async () => [],
    },
    projects: {
      getProjectById: async () => null,
      getPublicProjectById: async () => null,
      getPublicProjectBySlug: async () => null,
      listAdminProjects: async () => [{ slug: "existing-project" }],
      listProjectOptions: async () => [],
      upsertProject: async (input) => {
        upsertCalls.push({
          slug: input.slug,
          status: input.status,
        });

        return {
          slug: input.slug,
        };
      },
    },
  });

  const listedProjects = await service.listAdminProjects();
  const syncedProject = await service.upsertProject({
    contentMarkdown: "Body",
    publishedAt: null,
    slug: "new-project",
    status: "published",
    summary: "Summary",
    title: "New Project",
  });

  assert.deepEqual(listedProjects, [{ slug: "existing-project" }]);
  assert.deepEqual(upsertCalls, [{ slug: "new-project", status: "published" }]);
  assert.deepEqual(syncedProject, { slug: "new-project" });
});

test("createBlogContentService creates and updates project identities through the repository", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        listAdminPosts: () => Promise<unknown[]>;
      };
      projects: {
        createProject: (input: {
          slug: string;
          status?: "draft" | "published";
          summary?: string | null;
          title: string;
        }) => Promise<{ id: string }>;
        getAdminProjectById: (id: string) => Promise<{ id: string } | null>;
        getProjectById: (id: string) => Promise<null>;
        getPublicProjectById: (id: string) => Promise<null>;
        getPublicProjectBySlug: (slug: string) => Promise<null>;
        listAdminProjects: () => Promise<unknown[]>;
        listProjectOptions: () => Promise<unknown[]>;
        updateProject: (id: string, input: {
          slug?: string;
          status?: "draft" | "published";
          summary?: string | null;
          title?: string;
        }) => Promise<{ id: string; slug: string }>;
        upsertProject: (input: {
          contentMarkdown: string | null;
          publishedAt: string | null;
          slug: string;
          status: "draft" | "published";
          summary: string | null;
          title: string;
        }) => Promise<{ slug: string }>;
      };
    }) => {
      createProject: (input: {
        slug: string;
        status?: "draft" | "published";
        summary?: string | null;
        title: string;
      }) => Promise<{ id: string }>;
      updateProject: (id: string, input: {
        slug?: string;
        status?: "draft" | "published";
        summary?: string | null;
        title?: string;
      }) => Promise<{ id: string; slug: string }>;
    };
  }>("./service.ts", "content service");

  const createCalls: string[] = [];
  const updateCalls: string[] = [];

  const service = serviceModule.createBlogContentService({
    posts: {
      listAdminPosts: async () => [],
    },
    projects: {
      createProject: async (input) => {
        createCalls.push(input.slug);
        return { id: "project-1" };
      },
      getAdminProjectById: async (id) => (id === "project-1" ? { id } : null),
      getProjectById: async () => null,
      getPublicProjectById: async () => null,
      getPublicProjectBySlug: async () => null,
      listAdminProjects: async () => [],
      listProjectOptions: async () => [],
      updateProject: async (id, input) => {
        updateCalls.push(`${id}:${input.slug ?? ""}`);
        return { id, slug: input.slug ?? "unchanged" };
      },
      upsertProject: async (input) => ({ slug: input.slug }),
    },
  });

  await service.createProject({
    slug: "new-project",
    status: "published",
    summary: "Summary",
    title: "New project",
  });
  const updated = await service.updateProject("project-1", {
    slug: "updated-project",
  });

  assert.deepEqual(createCalls, ["new-project"]);
  assert.deepEqual(updateCalls, ["project-1:updated-project"]);
  assert.deepEqual(updated, { id: "project-1", slug: "updated-project" });
});

test("createBlogContentService creates a published post with the current timestamp", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      now: () => Date;
      posts: {
        createPost: (input: {
          contentMarkdown: string;
          excerpt?: string | null;
          publishedAt?: string | null;
          relatedProjectId?: string | null;
          slug: string;
          status?: "draft" | "published";
          title: string;
        }) => Promise<{
          id: string;
          publishedAt: string | null;
          status: "draft" | "published";
        }>;
        getAdminPostById: (id: string) => Promise<null>;
        listAdminPosts: () => Promise<unknown[]>;
        listPublishedPosts: () => Promise<unknown[]>;
        publishPost: (id: string, publishedAt: string) => Promise<unknown>;
        getPublishedPostBySlug: (slug: string) => Promise<unknown>;
        updatePost: (id: string, input: unknown) => Promise<unknown>;
      };
      projects: {
        listProjectOptions: () => Promise<unknown[]>;
      };
    }) => {
      createPost: (input: {
        contentMarkdown: string;
        excerpt?: string | null;
        relatedProjectId?: string | null;
        slug: string;
        status?: "draft" | "published";
        title: string;
      }) => Promise<{
        id: string;
        publishedAt: string | null;
        status: "draft" | "published";
      }>;
    };
  }>("./service.ts", "content service");

  const createCalls: Array<{
    contentMarkdown: string;
    excerpt?: string | null;
    publishedAt?: string | null;
    relatedProjectId?: string | null;
    slug: string;
    status?: "draft" | "published";
    title: string;
  }> = [];

  const service = serviceModule.createBlogContentService({
    now: () => new Date("2026-06-02T12:34:56.000Z"),
    posts: {
      createPost: async (input) => {
        createCalls.push(input);

        return {
          id: "post-3",
          status: input.status ?? "draft",
          publishedAt: input.publishedAt ?? null,
        };
      },
      getAdminPostById: async () => null,
      listAdminPosts: async () => [],
      listPublishedPosts: async () => [],
      publishPost: async () => {
        throw new Error("publishPost should not be called");
      },
      getPublishedPostBySlug: async () => null,
      updatePost: async () => {
        throw new Error("updatePost should not be called");
      },
    },
    projects: {
      listProjectOptions: async () => [],
    },
  });

  const result = await service.createPost({
    contentMarkdown: "# Published",
    excerpt: null,
    relatedProjectId: null,
    slug: "published-post",
    status: "published",
    title: "Published post",
  });

  assert.deepEqual(createCalls, [
    {
      contentMarkdown: "# Published",
      excerpt: null,
      publishedAt: "2026-06-02T12:34:56.000Z",
      relatedProjectId: null,
      slug: "published-post",
      status: "published",
      title: "Published post",
    },
  ]);
  assert.deepEqual(result, {
    id: "post-3",
    status: "published",
    publishedAt: "2026-06-02T12:34:56.000Z",
  });
});

test("createBlogContentService throws BlogPostNotFoundError when updating a missing post", async () => {
  const serviceModule = await loadModule<{
    BlogPostNotFoundError: new (id: string) => Error;
    createBlogContentService: (input: {
      posts: {
        createPost: (input: unknown) => Promise<unknown>;
        getAdminPostById: (id: string) => Promise<null>;
        listAdminPosts: () => Promise<unknown[]>;
        listPublishedPosts: () => Promise<unknown[]>;
        publishPost: (id: string, publishedAt: string) => Promise<unknown>;
        getPublishedPostBySlug: (slug: string) => Promise<unknown>;
        updatePost: (id: string, input: unknown) => Promise<unknown>;
      };
      projects: {
        listProjectOptions: () => Promise<unknown[]>;
      };
    }) => {
      updatePost: (id: string, input: {
        title: string;
      }) => Promise<unknown>;
    };
  }>("./service.ts", "content service");

  const service = serviceModule.createBlogContentService({
    posts: {
      createPost: async () => {
        throw new Error("createPost should not be called");
      },
      getAdminPostById: async () => null,
      listAdminPosts: async () => [],
      listPublishedPosts: async () => [],
      publishPost: async () => {
        throw new Error("publishPost should not be called");
      },
      getPublishedPostBySlug: async () => null,
      updatePost: async () => {
        throw new Error("updatePost should not be called");
      },
    },
    projects: {
      listProjectOptions: async () => [],
    },
  });

  await assert.rejects(
    () =>
      service.updatePost("missing-post", {
        title: "Updated title",
      }),
    (error) => error instanceof serviceModule.BlogPostNotFoundError,
  );
});

test("createBlogContentService rejects deleting a published post", async () => {
  const serviceModule = await loadModule<{
    PublishedContentDeletionError: new (contentType: string, id: string) => Error;
    createBlogContentService: (input: {
      posts: {
        deletePost: (id: string) => Promise<unknown>;
        getAdminPostById: (id: string) => Promise<{
          id: string;
          status: "draft" | "published";
        } | null>;
        listAdminPosts: () => Promise<unknown[]>;
        listPublishedPosts: () => Promise<unknown[]>;
        listPublishedPostsByProjectId: (projectId: string) => Promise<unknown[]>;
        getPublishedPostBySlug: (slug: string) => Promise<unknown>;
        publishPost: (id: string, publishedAt: string) => Promise<unknown>;
        updatePost: (id: string, input: unknown) => Promise<unknown>;
      };
      projects: {
        listAdminProjects: () => Promise<unknown[]>;
        listProjectOptions: () => Promise<unknown[]>;
        listPublishedProjects: () => Promise<unknown[]>;
      };
    }) => {
      deletePost: (id: string) => Promise<void>;
    };
  }>("./service.ts", "content service");

  let deleteCalled = false;

  const service = serviceModule.createBlogContentService({
    posts: {
      deletePost: async () => {
        deleteCalled = true;
      },
      getAdminPostById: async () => ({
        id: "post-1",
        status: "published",
      }),
      listAdminPosts: async () => [],
      listPublishedPosts: async () => [],
      listPublishedPostsByProjectId: async () => [],
      getPublishedPostBySlug: async () => null,
      publishPost: async () => {
        throw new Error("publishPost should not be called");
      },
      updatePost: async () => {
        throw new Error("updatePost should not be called");
      },
    },
    projects: {
      listAdminProjects: async () => [],
      listProjectOptions: async () => [],
      listPublishedProjects: async () => [],
    },
  });

  await assert.rejects(
    () => service.deletePost("post-1"),
    (error) =>
      error instanceof serviceModule.PublishedContentDeletionError &&
      error.message === "已上架文章不能直接刪除，請先下架再刪除。",
  );
  assert.equal(deleteCalled, false);
});

test("createBlogContentService deletes a draft post", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        deletePost: (id: string) => Promise<void>;
        getAdminPostById: (id: string) => Promise<{
          id: string;
          status: "draft" | "published";
        } | null>;
        listAdminPosts: () => Promise<unknown[]>;
        listPublishedPosts: () => Promise<unknown[]>;
        listPublishedPostsByProjectId: (projectId: string) => Promise<unknown[]>;
        getPublishedPostBySlug: (slug: string) => Promise<unknown>;
        publishPost: (id: string, publishedAt: string) => Promise<unknown>;
        updatePost: (id: string, input: unknown) => Promise<unknown>;
      };
      projects: {
        listAdminProjects: () => Promise<unknown[]>;
        listProjectOptions: () => Promise<unknown[]>;
        listPublishedProjects: () => Promise<unknown[]>;
      };
    }) => {
      deletePost: (id: string) => Promise<void>;
    };
  }>("./service.ts", "content service");

  const deletedIds: string[] = [];

  const service = serviceModule.createBlogContentService({
    posts: {
      deletePost: async (id) => {
        deletedIds.push(id);
      },
      getAdminPostById: async () => ({
        id: "post-2",
        status: "draft",
      }),
      listAdminPosts: async () => [],
      listPublishedPosts: async () => [],
      listPublishedPostsByProjectId: async () => [],
      getPublishedPostBySlug: async () => null,
      publishPost: async () => {
        throw new Error("publishPost should not be called");
      },
      updatePost: async () => {
        throw new Error("updatePost should not be called");
      },
    },
    projects: {
      listAdminProjects: async () => [],
      listProjectOptions: async () => [],
      listPublishedProjects: async () => [],
    },
  });

  await service.deletePost("post-2");

  assert.deepEqual(deletedIds, ["post-2"]);
});

test("createBlogContentService rejects deleting a published project", async () => {
  const serviceModule = await loadModule<{
    PublishedContentDeletionError: new (contentType: string, id: string) => Error;
    createBlogContentService: (input: {
      posts: {
        listAdminPosts: () => Promise<unknown[]>;
        listPublishedPosts: () => Promise<unknown[]>;
        listPublishedPostsByProjectId: (projectId: string) => Promise<unknown[]>;
      };
      projects: {
        deleteProject: (id: string) => Promise<unknown>;
        getAdminProjectById: (id: string) => Promise<{
          id: string;
          status: "draft" | "published";
        } | null>;
        listAdminProjects: () => Promise<unknown[]>;
        listProjectOptions: () => Promise<unknown[]>;
        listPublishedProjects: () => Promise<unknown[]>;
      };
    }) => {
      deleteProject: (id: string) => Promise<void>;
    };
  }>("./service.ts", "content service");

  let deleteCalled = false;

  const service = serviceModule.createBlogContentService({
    posts: {
      listAdminPosts: async () => [],
      listPublishedPosts: async () => [],
      listPublishedPostsByProjectId: async () => [],
    },
    projects: {
      deleteProject: async () => {
        deleteCalled = true;
      },
      getAdminProjectById: async () => ({
        id: "project-1",
        status: "published",
      }),
      listAdminProjects: async () => [],
      listProjectOptions: async () => [],
      listPublishedProjects: async () => [],
    },
  });

  await assert.rejects(
    () => service.deleteProject("project-1"),
    (error) =>
      error instanceof serviceModule.PublishedContentDeletionError &&
      error.message === "已上架專案不能直接刪除，請先下架再刪除。",
  );
  assert.equal(deleteCalled, false);
});

test("createBlogContentService deletes a draft project", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        listAdminPosts: () => Promise<unknown[]>;
        listPublishedPosts: () => Promise<unknown[]>;
        listPublishedPostsByProjectId: (projectId: string) => Promise<unknown[]>;
      };
      projects: {
        deleteProject: (id: string) => Promise<void>;
        getAdminProjectById: (id: string) => Promise<{
          id: string;
          status: "draft" | "published";
        } | null>;
        listAdminProjects: () => Promise<unknown[]>;
        listProjectOptions: () => Promise<unknown[]>;
        listPublishedProjects: () => Promise<unknown[]>;
      };
    }) => {
      deleteProject: (id: string) => Promise<void>;
    };
  }>("./service.ts", "content service");

  const deletedIds: string[] = [];

  const service = serviceModule.createBlogContentService({
    posts: {
      listAdminPosts: async () => [],
      listPublishedPosts: async () => [],
      listPublishedPostsByProjectId: async () => [],
    },
    projects: {
      deleteProject: async (id) => {
        deletedIds.push(id);
      },
      getAdminProjectById: async () => ({
        id: "project-2",
        status: "draft",
      }),
      listAdminProjects: async () => [],
      listProjectOptions: async () => [],
      listPublishedProjects: async () => [],
    },
  });

  await service.deleteProject("project-2");

  assert.deepEqual(deletedIds, ["project-2"]);
});

test("createBlogContentService reorders posts with the complete id list", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        listAdminPosts: () => Promise<Array<{ id: string }>>;
        reorderPosts: (idsInOrder: string[]) => Promise<void>;
      };
      projects: {
        listAdminProjects: () => Promise<unknown[]>;
      };
    }) => {
      reorderPosts: (idsInOrder: string[]) => Promise<void>;
    };
  }>("./service.ts", "content service");

  const reorderCalls: string[][] = [];

  const service = serviceModule.createBlogContentService({
    posts: {
      listAdminPosts: async () => [{ id: "post-1" }, { id: "post-2" }, { id: "post-3" }],
      reorderPosts: async (idsInOrder) => {
        reorderCalls.push(idsInOrder);
      },
    },
    projects: {
      listAdminProjects: async () => [],
    },
  });

  await service.reorderPosts(["post-3", "post-1", "post-2"]);

  assert.deepEqual(reorderCalls, [["post-3", "post-1", "post-2"]]);
});

test("createBlogContentService reorders projects with the complete id list", async () => {
  const serviceModule = await loadModule<{
    createBlogContentService: (input: {
      posts: {
        listAdminPosts: () => Promise<unknown[]>;
      };
      projects: {
        listAdminProjects: () => Promise<Array<{ id: string }>>;
        reorderProjects: (idsInOrder: string[]) => Promise<void>;
      };
    }) => {
      reorderProjects: (idsInOrder: string[]) => Promise<void>;
    };
  }>("./service.ts", "content service");

  const reorderCalls: string[][] = [];

  const service = serviceModule.createBlogContentService({
    posts: {
      listAdminPosts: async () => [],
    },
    projects: {
      listAdminProjects: async () => [{ id: "project-1" }, { id: "project-2" }, { id: "project-3" }],
      reorderProjects: async (idsInOrder) => {
        reorderCalls.push(idsInOrder);
      },
    },
  });

  await service.reorderProjects(["project-2", "project-3", "project-1"]);

  assert.deepEqual(reorderCalls, [["project-2", "project-3", "project-1"]]);
});

test("createBlogContentService rejects invalid reorder payloads", async () => {
  const serviceModule = await loadModule<{
    InvalidContentOrderError: new (contentType: string, reason: string) => Error;
    createBlogContentService: (input: {
      posts: {
        listAdminPosts: () => Promise<Array<{ id: string }>>;
        reorderPosts: (idsInOrder: string[]) => Promise<void>;
      };
      projects: {
        listAdminProjects: () => Promise<Array<{ id: string }>>;
        reorderProjects: (idsInOrder: string[]) => Promise<void>;
      };
    }) => {
      reorderPosts: (idsInOrder: string[]) => Promise<void>;
      reorderProjects: (idsInOrder: string[]) => Promise<void>;
    };
  }>("./service.ts", "content service");

  const service = serviceModule.createBlogContentService({
    posts: {
      listAdminPosts: async () => [{ id: "post-1" }, { id: "post-2" }],
      reorderPosts: async () => {
        throw new Error("reorderPosts should not be called");
      },
    },
    projects: {
      listAdminProjects: async () => [{ id: "project-1" }, { id: "project-2" }],
      reorderProjects: async () => {
        throw new Error("reorderProjects should not be called");
      },
    },
  });

  await assert.rejects(
    () => service.reorderPosts([]),
    (error) =>
      error instanceof serviceModule.InvalidContentOrderError &&
      error.message === "文章排序資料不可為空。",
  );
  await assert.rejects(
    () => service.reorderPosts(["post-1", "post-1"]),
    (error) =>
      error instanceof serviceModule.InvalidContentOrderError &&
      error.message === "文章排序資料不可包含重複 id。",
  );
  await assert.rejects(
    () => service.reorderProjects(["project-1"]),
    (error) =>
      error instanceof serviceModule.InvalidContentOrderError &&
      error.message === "專案排序資料必須包含目前全部內容。",
  );
});
