"use server";

import { defaultServerActions } from "./action-core.ts";
import type { AdminProjectFormState } from "./action-state.ts";

export async function createAdminProjectAction(state: AdminProjectFormState, formData: FormData) {
  return defaultServerActions.createProject(state, formData);
}

export async function updateAdminProjectAction(state: AdminProjectFormState, formData: FormData) {
  return defaultServerActions.updateProject(state, formData);
}
