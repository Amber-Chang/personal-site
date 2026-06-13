"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { clearActiveAdminSession } from "@/lib/auth/session-server.ts";
import { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_COOKIE_OPTIONS } from "@/lib/auth/session.ts";
import { requireTrustedAdminOrigin } from "@/lib/auth/trusted-origin.ts";
import { readSupabaseEnv } from "@/lib/infra/supabase/env.ts";

export async function requestAdminLogout() {
  const env = readSupabaseEnv();
  const requestHeaders = await headers();
  const cookieStore = await cookies();

  await requireTrustedAdminOrigin({
    headers: requestHeaders,
    siteUrl: env.siteUrl,
  });

  await clearActiveAdminSession({
    cookieStore,
  });

  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, "", {
    ...ADMIN_SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });

  redirect("/admin/login");
}
