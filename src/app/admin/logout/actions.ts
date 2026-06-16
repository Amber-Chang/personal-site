"use server";

import { cookies, headers } from "next/headers.js";
import { redirect } from "next/navigation.js";

import { createRequestAdminLogoutAction } from "../../../lib/auth/admin-logout-action.ts";
import { clearActiveAdminSession } from "../../../lib/auth/session-server.ts";
import { requireTrustedAdminOrigin } from "../../../lib/auth/trusted-origin.ts";
import { readSupabaseEnv } from "../../../lib/infra/supabase/env.ts";
import { createServerSupabaseClient } from "../../../lib/infra/supabase/server.ts";

export const requestAdminLogout = createRequestAdminLogoutAction({
  clearActiveAdminSession,
  cookies,
  createServerSupabaseClient: (input) =>
    createServerSupabaseClient(input) as Parameters<typeof createRequestAdminLogoutAction>[0]["createServerSupabaseClient"] extends (
      ...args: never[]
    ) => infer TResult
      ? TResult
      : never,
  headers,
  readSupabaseEnv,
  redirect,
  requireTrustedAdminOrigin,
});
