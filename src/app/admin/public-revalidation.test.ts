// SPEC-005：後台每一種內容變更（文章與案例的新增、修改、發佈、取消發佈、刪除、排序）都讓全站公開頁與 sitemap.xml
// 立即標記為需要更新。發佈與取消發佈走 updatePost／updateProject（文章看 intent、案例看 status）。
import assert from "node:assert/strict";
import test from "node:test";

import { createAdminPostMutationActions } from "./posts/action-core.ts";
import { createAdminProjectMutationActions } from "./projects/action-core.ts";

type Revalidation = { path: string; type?: "layout" | "page" };

function createRecorder() {
  const calls: Revalidation[] = [];

  return {
    calls,
    revalidatePath: (path: string, type?: "layout" | "page") => {
      calls.push(type ? { path, type } : { path });
    },
  };
}

function redirectTo(path: string): never {
  throw new Error(`redirect:${path}`);
}

function formData(entries: Record<string, string>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(entries)) {
    data.set(key, value);
  }

  return data;
}

function assertRevalidatesEveryPublicPage(calls: Revalidation[], label: string) {
  assert.ok(
    calls.some((call) => call.path === "/" && call.type === "layout"),
    `${label}: expected revalidatePath("/", "layout"), got ${JSON.stringify(calls)}`,
  );
  assert.ok(
    calls.some((call) => call.path === "/sitemap.xml" && call.type === undefined),
    `${label}: expected revalidatePath("/sitemap.xml"), got ${JSON.stringify(calls)}`,
  );
  // /projects 已永久轉址到首頁，不再是要更新的頁面。
  assert.ok(!calls.some((call) => call.path === "/projects"), `${label}: should not revalidate /projects`);
}

async function runAndIgnoreRedirect(run: () => Promise<unknown>) {
  await run().catch((error: unknown) => {
    if (!(error instanceof Error) || !error.message.startsWith("redirect:")) {
      throw error;
    }
  });
}

const postRecord = { id: "post-1" };
const postFields = {
  content_markdown: "Body",
  excerpt: "",
  related_project_id: "",
  slug: "a-post",
  status: "draft",
  title: "A post",
};

function createPostActions(recorder: ReturnType<typeof createRecorder>, failing = false) {
  const fail = async (): Promise<never> => {
    throw new Error("supabase write failed");
  };

  return createAdminPostMutationActions({
    redirectTo,
    revalidatePath: recorder.revalidatePath,
    service: {
      createPost: failing ? fail : async () => postRecord as never,
      deletePost: failing ? fail : async () => {},
      reorderPosts: failing ? fail : async () => {},
      updatePost: failing ? fail : async () => postRecord as never,
    } as never,
  });
}

const postMutations: Array<[string, (actions: ReturnType<typeof createPostActions>) => Promise<unknown>]> = [
  ["create post", (actions) => actions.createPost({ error: null }, formData(postFields))],
  ["update post", (actions) => actions.updatePost({ error: null }, formData({ ...postFields, id: "post-1" }))],
  ["publish post", (actions) => actions.updatePost({ error: null }, formData({ ...postFields, id: "post-1", intent: "publish" }))],
  [
    "unpublish post",
    (actions) => actions.updatePost({ error: null }, formData({ ...postFields, id: "post-1", intent: "draft", status: "published" })),
  ],
  ["delete post", (actions) => actions.deletePost("post-1")],
  ["reorder posts", (actions) => actions.reorderPosts(["post-2", "post-1"])],
];

const projectRecord = { id: "project-1" };
const projectFields = {
  contentMarkdown: "Body",
  outcomes: "",
  period: "",
  projectType: "work",
  role: "",
  slug: "a-project",
  status: "draft",
  summary: "Summary",
  tags: "",
  title: "A project",
};

function createProjectActions(recorder: ReturnType<typeof createRecorder>, failing = false) {
  const fail = async (): Promise<never> => {
    throw new Error("supabase write failed");
  };

  return createAdminProjectMutationActions({
    redirectTo,
    revalidatePath: recorder.revalidatePath,
    service: {
      createProject: failing ? fail : async () => projectRecord as never,
      deleteProject: failing ? fail : async () => {},
      reorderProjects: failing ? fail : async () => {},
      updateProject: failing ? fail : async () => projectRecord as never,
    } as never,
  });
}

const projectMutations: Array<[string, (actions: ReturnType<typeof createProjectActions>) => Promise<unknown>]> = [
  ["create project", (actions) => actions.createProject({ error: null }, formData(projectFields))],
  ["update project", (actions) => actions.updateProject({ error: null }, formData({ ...projectFields, id: "project-1" }))],
  [
    "publish project",
    (actions) => actions.updateProject({ error: null }, formData({ ...projectFields, id: "project-1", status: "published" })),
  ],
  ["unpublish project", (actions) => actions.updateProject({ error: null }, formData({ ...projectFields, id: "project-1", status: "draft" }))],
  ["delete project", (actions) => actions.deleteProject("project-1")],
  ["reorder projects", (actions) => actions.reorderProjects(["project-2", "project-1"])],
];

test("every post mutation marks all public pages and the sitemap for regeneration", async () => {
  for (const [label, run] of postMutations) {
    const recorder = createRecorder();

    await runAndIgnoreRedirect(() => run(createPostActions(recorder)));
    assertRevalidatesEveryPublicPage(recorder.calls, label);
  }
});

test("every project mutation marks all public pages and the sitemap for regeneration", async () => {
  for (const [label, run] of projectMutations) {
    const recorder = createRecorder();

    await runAndIgnoreRedirect(() => run(createProjectActions(recorder)));
    assertRevalidatesEveryPublicPage(recorder.calls, label);
  }
});

test("a failed mutation does not mark public pages for regeneration", async () => {
  for (const [label, run] of postMutations) {
    const recorder = createRecorder();
    const result = await run(createPostActions(recorder, true));

    assert.deepEqual(result, { error: "supabase write failed" }, label);
    assert.deepEqual(recorder.calls, [], label);
  }

  for (const [label, run] of projectMutations) {
    const recorder = createRecorder();
    const result = await run(createProjectActions(recorder, true));

    assert.deepEqual(result, { error: "supabase write failed" }, label);
    assert.deepEqual(recorder.calls, [], label);
  }
});
