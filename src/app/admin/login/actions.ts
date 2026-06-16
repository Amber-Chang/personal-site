"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { createRequestAdminLoginAction } from "@/lib/auth/admin-login-oauth-action.ts";
import { requireTrustedAdminOrigin } from "@/lib/auth/trusted-origin.ts";
import { readSupabaseEnv } from "@/lib/infra/supabase/env.ts";
import { createServerSupabaseClient } from "@/lib/infra/supabase/server.ts";
import type { AdminLoginFormState } from "./action-state.ts";

export const requestAdminLogin = createRequestAdminLoginAction({
  cookies,
  headers,
  createServerSupabaseClient: (input) =>
    createServerSupabaseClient(input) as Parameters<typeof createRequestAdminLoginAction>[0]["createServerSupabaseClient"] extends (
      ...args: never[]
    ) => infer TResult
      ? TResult
      : never,
  readSupabaseEnv,
  redirect,
  requireTrustedAdminOrigin,
}) as (_state: AdminLoginFormState, formData: FormData) => Promise<AdminLoginFormState>;
