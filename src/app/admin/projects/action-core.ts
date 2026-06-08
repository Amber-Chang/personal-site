import { ProjectNotFoundError } from "../../../lib/content/service.ts";
import { AdminAuthorizationError } from "../../../lib/auth/guards.ts";
import type { CreateProjectInput, UpdateProjectInput } from "../../../lib/content/types.ts";
import type { AdminProjectFormState } from "./action-state.ts";

export { initialAdminProjectFormState } from "./action-state.ts";
export type { AdminProjectFormState } from "./action-state.ts";

type AdminProjectMutationService = {
  createProject: (input: CreateProjectInput) => Promise<{ id: string }>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<{ id: string }>;
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

  throw new Error("專案狀態無效。");
}

function parseFormValues(formData: FormData): CreateProjectInput {
  return {
    slug: parseRequiredTrimmedField(formData, "slug", "slug"),
    status: parseStatus(formData),
    summary: getStringValue(formData, "summary")?.trim() || null,
    title: parseRequiredTrimmedField(formData, "title", "標題"),
  };
}

function toErrorState(error: unknown): AdminProjectFormState {
  console.error("admin project mutation failed", error);

  if (error instanceof AdminAuthorizationError) {
    return {
      error: "登入狀態已失效，請重新登入。",
    };
  }

  if (error instanceof ProjectNotFoundError) {
    return {
      error: "找不到指定專案。",
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

export function createAdminProjectMutationActions(input: {
  redirectTo: (path: string) => never;
  revalidatePath: (path: string) => void;
  service: AdminProjectMutationService;
}) {
  return {
    async createProject(_state: AdminProjectFormState, formData: FormData): Promise<AdminProjectFormState> {
      let project: { id: string };

      try {
        project = await input.service.createProject(parseFormValues(formData));
      } catch (error) {
        return toErrorState(error);
      }

      input.revalidatePath("/admin/projects");
      input.revalidatePath(`/admin/projects/${project.id}`);
      input.redirectTo(`/admin/projects/${project.id}`);
    },
    async updateProject(_state: AdminProjectFormState, formData: FormData): Promise<AdminProjectFormState> {
      let project: { id: string };

      try {
        const id = parseRequiredTrimmedField(formData, "id", "專案 ID");
        project = await input.service.updateProject(id, parseFormValues(formData));
      } catch (error) {
        return toErrorState(error);
      }

      input.revalidatePath("/admin/projects");
      input.revalidatePath(`/admin/projects/${project.id}`);
      input.redirectTo(`/admin/projects/${project.id}`);
    },
  };
}

async function createDefaultMutationActions() {
  const [{ revalidatePath }, { redirect }, { requireAdminContentService }] = await Promise.all([
    import("next/cache.js"),
    import("next/navigation.js"),
    import("../posts/admin-context.ts"),
  ]);

  return createAdminProjectMutationActions({
    redirectTo: redirect,
    revalidatePath,
    service: await requireAdminContentService(),
  });
}

export function createAdminProjectServerActions(input: {
  getActions: () => Promise<{
    createProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
    updateProject: (state: AdminProjectFormState, formData: FormData) => Promise<AdminProjectFormState>;
  }>;
}) {
  return {
    async createProject(state: AdminProjectFormState, formData: FormData) {
      try {
        const actions = await input.getActions();

        return actions.createProject(state, formData);
      } catch (error) {
        return toErrorState(error);
      }
    },
    async updateProject(state: AdminProjectFormState, formData: FormData) {
      try {
        const actions = await input.getActions();

        return actions.updateProject(state, formData);
      } catch (error) {
        return toErrorState(error);
      }
    },
  };
}

export const defaultServerActions = createAdminProjectServerActions({
  getActions: createDefaultMutationActions,
});
