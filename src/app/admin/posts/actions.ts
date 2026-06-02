"use server";

import { defaultServerActions } from "./action-core.ts";
import type { AdminPostFormState } from "./action-state.ts";

export async function createAdminPostAction(state: AdminPostFormState, formData: FormData) {
  return defaultServerActions.createPost(state, formData);
}

export async function updateAdminPostAction(state: AdminPostFormState, formData: FormData) {
  return defaultServerActions.updatePost(state, formData);
}
