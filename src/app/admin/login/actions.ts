"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_COOKIE_OPTIONS } from "@/lib/auth/session.ts";
import { createAdminLoginAction } from "@/lib/auth/login-action.ts";
import { readSupabaseEnv } from "@/lib/infra/supabase/env.ts";
import type { AdminLoginFormState } from "./action-state.ts";

export async function requestAdminLogin(_state: AdminLoginFormState, formData: FormData): Promise<AdminLoginFormState> {
  const env = readSupabaseEnv();
  const cookieStore = await cookies();
  const action = createAdminLoginAction({
    adminPassword: env.adminPassword,
    setAdminSession: (sessionToken) => {
      cookieStore.set(ADMIN_SESSION_COOKIE_NAME, sessionToken, ADMIN_SESSION_COOKIE_OPTIONS);
    },
  });

  const result = await action(formData);

  if (result.ok) {
    redirect("/admin/posts");
  }

  return {
    ok: false,
    error: result.error,
  };
}
