"use server";

import { defaultServerActions } from "./action-core.ts";
import type { AdminProjectFormState } from "./action-state.ts";

export async function createAdminProjectAction(state: AdminProjectFormState, formData: FormData) {
  return defaultServerActions.createProject(state, formData);
}

export async function deleteAdminProjectAction(id: string) {
  return defaultServerActions.deleteProject(id);
}

export async function reorderAdminProjectsAction(idsInOrder: string[]) {
  return defaultServerActions.reorderProjects(idsInOrder);
}

export async function updateAdminProjectAction(state: AdminProjectFormState, formData: FormData) {
  return defaultServerActions.updateProject(state, formData);
}
