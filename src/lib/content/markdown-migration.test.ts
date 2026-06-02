import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type { BlogPostRecord, CreateBlogPostInput } from "./types.ts";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

function createTempPostsDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "markdown-posts-"));
}

function createPostRecord(input: CreateBlogPostInput, overrides?: Partial<BlogPostRecord>): BlogPostRecord {
  return {
    contentMarkdown: input.contentMarkdown,
    createdAt: "2026-06-02T00:00:00.000Z",
    excerpt: input.excerpt ?? null,
    id: overrides?.id ?? `post-${input.slug}`,
    publishedAt: input.publishedAt ?? null,
    relatedProjectId: input.relatedProjectId ?? null,
    slug: input.slug,
    status: input.status ?? "draft",
    title: input.title,
    updatedAt: "2026-06-02T00:00:00.000Z",
    ...overrides,
  };
}

test("loadMarkdownPostInputs maps markdown files to blog post create inputs", async () => {
  const migrationModule = await loadModule<{
    loadMarkdownPostInputs: (directory: string) => Promise<CreateBlogPostInput[]>;
  }>("./markdown-migration.ts", "markdown migration");

  const postsDirectory = createTempPostsDirectory();
  fs.writeFileSync(
    path.join(postsDirectory, "published-post.md"),
    [
      "---",
      'title: "Published Post"',
      'date: "2026-02-20"',
      "draft: false",
      "---",
      "",
      "第一段內容",
    ].join("\n"),
  );
  fs.writeFileSync(
    path.join(postsDirectory, "draft-post.md"),
    [
      "---",
      'title: "Draft Post"',
      'date: "2026-02-21"',
      "draft: true",
      "---",
      "",
      "草稿內容",
    ].join("\n"),
  );
  fs.writeFileSync(path.join(postsDirectory, "notes.txt"), "ignore me");

  const inputs = await migrationModule.loadMarkdownPostInputs(postsDirectory);

  assert.deepEqual(inputs, [
    {
      contentMarkdown: "草稿內容",
      excerpt: null,
      publishedAt: null,
      relatedProjectId: null,
      slug: "draft-post",
      status: "draft",
      title: "Draft Post",
    },
    {
      contentMarkdown: "第一段內容",
      excerpt: null,
      publishedAt: "2026-02-20T00:00:00.000Z",
      relatedProjectId: null,
      slug: "published-post",
      status: "published",
      title: "Published Post",
    },
  ]);
});

test("package scripts expose the one-time markdown import command", () => {
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };

  assert.equal(
    packageJson.scripts?.["content:import-posts"],
    "node --no-warnings --experimental-strip-types scripts/import-markdown-posts.ts",
  );
});

test("importMarkdownPosts skips existing slugs and creates missing posts", async () => {
  const migrationModule = await loadModule<{
    importMarkdownPosts: (input: {
      posts: CreateBlogPostInput[];
      service: {
        createPost: (input: CreateBlogPostInput) => Promise<BlogPostRecord>;
        listAdminPosts: () => Promise<BlogPostRecord[]>;
      };
    }) => Promise<{
      created: string[];
      skipped: string[];
    }>;
  }>("./markdown-migration.ts", "markdown migration");

  const createCalls: CreateBlogPostInput[] = [];
  const existingPost = createPostRecord({
    contentMarkdown: "Existing",
    slug: "already-imported",
    status: "published",
    title: "Already imported",
  });

  const result = await migrationModule.importMarkdownPosts({
    posts: [
      {
        contentMarkdown: "Existing markdown",
        excerpt: null,
        publishedAt: "2026-02-20T00:00:00.000Z",
        relatedProjectId: null,
        slug: "already-imported",
        status: "published",
        title: "Already imported",
      },
      {
        contentMarkdown: "New markdown",
        excerpt: null,
        publishedAt: "2026-02-21T00:00:00.000Z",
        relatedProjectId: null,
        slug: "new-post",
        status: "published",
        title: "New post",
      },
    ],
    service: {
      createPost: async (input) => {
        createCalls.push(input);

        return createPostRecord(input);
      },
      listAdminPosts: async () => [existingPost],
    },
  });

  assert.deepEqual(createCalls, [
    {
      contentMarkdown: "New markdown",
      excerpt: null,
      publishedAt: "2026-02-21T00:00:00.000Z",
      relatedProjectId: null,
      slug: "new-post",
      status: "published",
      title: "New post",
    },
  ]);
  assert.deepEqual(result, {
    created: ["new-post"],
    skipped: ["already-imported"],
  });
});
