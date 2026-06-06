"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_COOKIE_OPTIONS } from "@/lib/auth/session.ts";
import { createAdminLoginAction } from "@/lib/auth/login-action.ts";
import {
  ADMIN_LOGIN_RATE_LIMIT_FALLBACK_IDENTIFIER,
  adminLoginRateLimit,
} from "@/lib/auth/login-rate-limit.ts";
import { createAdminServerSession } from "@/lib/auth/session-server.ts";
import { readSupabaseEnv } from "@/lib/infra/supabase/env.ts";
import type { AdminLoginFormState } from "./action-state.ts";

function resolveAdminLoginIdentifier(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const forwardedIp = forwardedFor
    ?.split(",")
    .map((value) => value.trim())
    .find(Boolean);

  if (forwardedIp) {
    return forwardedIp;
  }

  const realIp = requestHeaders.get("x-real-ip")?.trim();

  if (realIp) {
    return realIp;
  }

  return ADMIN_LOGIN_RATE_LIMIT_FALLBACK_IDENTIFIER;
}

export async function requestAdminLogin(_state: AdminLoginFormState, formData: FormData): Promise<AdminLoginFormState> {
  const env = readSupabaseEnv();
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const action = createAdminLoginAction({
    adminPassword: env.adminPassword,
    createAdminSession: () =>
      createAdminServerSession({
        adminPassword: env.adminPassword,
      }),
    loginIdentifier: resolveAdminLoginIdentifier(requestHeaders),
    getRateLimitState: adminLoginRateLimit.getRateLimitState,
    recordFailedAttempt: adminLoginRateLimit.recordFailedAttempt,
    resetAttempts: adminLoginRateLimit.resetAttempts,
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
