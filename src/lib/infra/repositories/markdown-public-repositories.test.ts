import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("createMarkdownPublicContentRepositories exposes published markdown posts and projects for public fallback reads", async () => {
  const repositoriesModule = await loadModule<{
    createMarkdownPublicContentRepositories: (input: {
      postsDirectory: string;
      projectsDirectory: string;
    }) => {
      posts: {
        getPublishedPostBySlug: (slug: string) => Promise<{
          contentMarkdown: string;
          relatedProjectId: string | null;
          slug: string;
          title: string;
        } | null>;
        listPublishedPosts: () => Promise<
          Array<{
            publishedAt: string | null;
            slug: string;
            status: "draft" | "published";
            title: string;
          }>
        >;
        listPublishedPostsByProjectId: (projectId: string) => Promise<unknown[]>;
      };
      projects: {
        getPublicProjectById: (id: string) => Promise<{ id: string; slug: string; title: string } | null>;
        getPublicProjectBySlug: (slug: string) => Promise<{
          content: string;
          id: string;
          slug: string;
          title: string;
        } | null>;
        listFeaturedProjects: () => Promise<Array<{ featured: boolean; slug: string }>>;
        listPublishedProjects: () => Promise<Array<{ featured: boolean; slug: string; title: string }>>;
      };
    };
  }>("./markdown-public-repositories.ts", "markdown public repositories");

  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "markdown-public-repositories-"));
  const postsDirectory = path.join(tempDirectory, "posts");
  const projectsDirectory = path.join(tempDirectory, "projects");

  await fs.mkdir(postsDirectory, { recursive: true });
  await fs.mkdir(projectsDirectory, { recursive: true });

  await fs.writeFile(
    path.join(postsDirectory, "published-note.md"),
    `---
title: Published Note
date: 2026-07-01
---

這是一篇公開文章。
`,
    "utf8",
  );
  await fs.writeFile(
    path.join(postsDirectory, "draft-note.md"),
    `---
title: Draft Note
date: 2026-07-02
draft: true
---

這是一篇草稿文章。
`,
    "utf8",
  );
  await fs.writeFile(
    path.join(projectsDirectory, "published-project.md"),
    `---
title: Published Project
slug: published-project
summary: Project summary
role: Product
period: 2026
featured: true
tags:
  - AI
outcomes:
  - Launch
---

專案內容。
`,
    "utf8",
  );
  await fs.writeFile(
    path.join(projectsDirectory, "draft-project.md"),
    `---
title: Draft Project
draft: true
---

草稿專案。
`,
    "utf8",
  );

  const repositories = repositoriesModule.createMarkdownPublicContentRepositories({
    postsDirectory,
    projectsDirectory,
  });

  const [posts, publishedPost, relatedPosts, projects, featuredProjects, publishedProject, projectById] = await Promise.all([
    repositories.posts.listPublishedPosts(),
    repositories.posts.getPublishedPostBySlug("published-note"),
    repositories.posts.listPublishedPostsByProjectId("published-project"),
    repositories.projects.listPublishedProjects(),
    repositories.projects.listFeaturedProjects(),
    repositories.projects.getPublicProjectBySlug("published-project"),
    repositories.projects.getPublicProjectById("published-project"),
  ]);

  assert.deepEqual(
    posts.map((post) => ({
      slug: post.slug,
      status: post.status,
      title: post.title,
    })),
    [
      {
        slug: "published-note",
        status: "published",
        title: "Published Note",
      },
    ],
  );
  assert.equal(publishedPost?.slug, "published-note");
  assert.equal(publishedPost?.relatedProjectId, null);
  assert.equal(publishedPost?.contentMarkdown, "這是一篇公開文章。");
  assert.deepEqual(relatedPosts, []);

  assert.deepEqual(
    projects.map((project) => ({
      featured: project.featured,
      slug: project.slug,
      title: project.title,
    })),
    [
      {
        featured: true,
        slug: "published-project",
        title: "Published Project",
      },
    ],
  );
  assert.deepEqual(
    featuredProjects.map((project) => project.slug),
    ["published-project"],
  );
  assert.equal(publishedProject?.id, "published-project");
  assert.equal(publishedProject?.content, "專案內容。");
  assert.equal(projectById?.id, "published-project");
});
