"use server";

import { BlogPostNotFoundError } from "../../../lib/content/service.ts";
import { AdminAuthorizationError } from "../../../lib/auth/guards.ts";
import type { CreateBlogPostInput, UpdateBlogPostInput } from "../../../lib/content/types.ts";

export type AdminPostFormState = {
  error: string | null;
};

export const initialAdminPostFormState: AdminPostFormState = {
  error: null,
};

type AdminPostMutationService = {
  createPost: (input: CreateBlogPostInput) => Promise<{ id: string }>;
  updatePost: (id: string, input: UpdateBlogPostInput) => Promise<{ id: string }>;
};

function getStringValue(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  return value;
}

function parseRequiredTrimmedField(formData: FormData, key: string, label: string) {
  const value = getStringValue(formData, key)?.trim() ?? "";

  if (!value) {
    throw new Error(`請輸入${label}。`);
  }

  return value;
}

function parseStatus(formData: FormData): "draft" | "published" {
  const value = getStringValue(formData, "status")?.trim();

  if (value === "draft" || value === "published") {
    return value;
  }

  throw new Error("文章狀態無效。");
}

function parseFormValues(formData: FormData): CreateBlogPostInput {
  return {
    contentMarkdown: getStringValue(formData, "content_markdown") ?? "",
    excerpt: getStringValue(formData, "excerpt")?.trim() || null,
    relatedProjectId: getStringValue(formData, "related_project_id")?.trim() || null,
    slug: parseRequiredTrimmedField(formData, "slug", "slug"),
    status: parseStatus(formData),
    title: parseRequiredTrimmedField(formData, "title", "標題"),
  };
}

function toErrorState(error: unknown): AdminPostFormState {
  if (error instanceof AdminAuthorizationError) {
    return {
      error: "登入狀態已失效，請重新登入。",
    };
  }

  if (error instanceof BlogPostNotFoundError) {
    return {
      error: "找不到指定文章。",
    };
  }

  if (error instanceof Error) {
    return {
      error: error.message,
    };
  }

  return {
    error: "儲存失敗，請稍後再試。",
  };
}

export function createAdminPostMutationActions(input: {
  redirectTo: (path: string) => never;
  revalidatePath: (path: string) => void;
  service: AdminPostMutationService;
}) {
  return {
    async createPost(_state: AdminPostFormState, formData: FormData): Promise<AdminPostFormState> {
      let post: { id: string };

      try {
        post = await input.service.createPost(parseFormValues(formData));
      } catch (error) {
        return toErrorState(error);
      }

      input.revalidatePath("/admin/posts");
      input.revalidatePath(`/admin/posts/${post.id}`);
      input.redirectTo(`/admin/posts/${post.id}`);
    },
    async updatePost(_state: AdminPostFormState, formData: FormData): Promise<AdminPostFormState> {
      let post: { id: string };

      try {
        const id = parseRequiredTrimmedField(formData, "id", "文章 ID");
        post = await input.service.updatePost(id, parseFormValues(formData));
      } catch (error) {
        return toErrorState(error);
      }

      input.revalidatePath("/admin/posts");
      input.revalidatePath(`/admin/posts/${post.id}`);
      input.redirectTo(`/admin/posts/${post.id}`);
    },
  };
}

async function createDefaultMutationActions() {
  const [{ revalidatePath }, { redirect }, { requireAdminContentService }] = await Promise.all([
    import("next/cache.js"),
    import("next/navigation.js"),
    import("./admin-context.ts"),
  ]);

  return createAdminPostMutationActions({
    redirectTo: redirect,
    revalidatePath,
    service: await requireAdminContentService(),
  });
}

export function createAdminPostServerActions(input: {
  getActions: () => Promise<{
    createPost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
    updatePost: (state: AdminPostFormState, formData: FormData) => Promise<AdminPostFormState>;
  }>;
}) {
  return {
    async createPost(state: AdminPostFormState, formData: FormData) {
      try {
        const actions = await input.getActions();

        return actions.createPost(state, formData);
      } catch (error) {
        return toErrorState(error);
      }
    },
    async updatePost(state: AdminPostFormState, formData: FormData) {
      try {
        const actions = await input.getActions();

        return actions.updatePost(state, formData);
      } catch (error) {
        return toErrorState(error);
      }
    },
  };
}

const defaultServerActions = createAdminPostServerActions({
  getActions: createDefaultMutationActions,
});

export async function createAdminPostAction(state: AdminPostFormState, formData: FormData) {
  return defaultServerActions.createPost(state, formData);
}

export async function updateAdminPostAction(state: AdminPostFormState, formData: FormData) {
  return defaultServerActions.updatePost(state, formData);
}
