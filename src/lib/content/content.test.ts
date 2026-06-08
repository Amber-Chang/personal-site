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
    order: { column: string; ascending: boolean } | null;
    table: string;
  }> = [];

  const repository = new repositoryModule.SupabaseBlogPostsRepository({
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

  const result = await repository.listPublishedPosts();

  assert.deepEqual(result, []);
  assert.deepEqual(calls, [
    {
      table: "blog_posts",
      columns: "*",
      filters: [{ column: "status", value: "published" }],
      order: { column: "published_at", ascending: false },
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
    order: { column: string; ascending: boolean } | null;
    table: string;
  }> = [];

  const repository = new repositoryModule.SupabaseBlogPostsRepository({
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
              eq: (nestedColumn, nestedValue) => {
                call.filters.push({ column: nestedColumn, value: nestedValue });

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
      order: { column: "published_at", ascending: false },
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

test("SupabaseProjectsRepository resolves a public project by slug with markdown-backed content", async () => {
  const repositoryModule = await loadModule<{
    SupabaseProjectsRepository: new (
      client: {
        from: (table: string) => {
          select: (columns: string) => {
            eq: (column: string, value: unknown) => {
              eq: (column: string, value: unknown) => {
                maybeSingle: () => Promise<{
                  data: {
                    id: string;
                    slug: string;
                    title: string;
                  } | null;
                  error: null;
                }>;
              };
            };
          };
        };
      },
      loadProjectBySlug: (slug: string) => {
        content: string;
        draft: boolean;
        outcomes: string[];
        period: string;
        role: string;
        slug: string;
        summary: string;
        tags: string[];
        title: string;
      } | null,
    ) => {
      getPublicProjectBySlug: (slug: string) => Promise<{
        content: string;
        id: string | null;
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

  const repository = new repositoryModule.SupabaseProjectsRepository(
    {
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
                        id: "project-1",
                        slug: "sms-management-platform",
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
    },
    (slug) =>
      slug === "sms-management-platform"
        ? {
            content: "專案內容",
            draft: false,
            outcomes: ["把需求整理成可執行流程"],
            period: "2025",
            role: "PM",
            slug,
            summary: "把分散需求產品化。",
            tags: ["產品策略"],
            title: "簡訊管理平台",
          }
        : null,
  );

  const result = await repository.getPublicProjectBySlug("sms-management-platform");

  assert.deepEqual(result, {
    content: "專案內容",
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
      columns: "id, slug, title",
      filters: [
        { column: "slug", value: "sms-management-platform" },
        { column: "status", value: "published" },
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
