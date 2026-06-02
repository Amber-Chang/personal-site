import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminGuardResult, requireAdminMutationSession } from "../../../lib/auth/guards.ts";
import { ADMIN_SESSION_COOKIE_NAME, hasValidAdminSessionToken } from "../../../lib/auth/session.ts";
import { createBlogContentService } from "../../../lib/content/service.ts";
import { createAdminContentRepositories } from "../../../lib/infra/repositories/factory.ts";
import { readSupabaseEnv } from "../../../lib/infra/supabase/env.ts";

async function hasAdminSession() {
  const env = readSupabaseEnv();
  const cookieStore = await cookies();

  return hasValidAdminSessionToken({
    adminPassword: env.adminPassword,
    sessionToken: cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value,
  });
}

function createAdminContentService() {
  return createBlogContentService(createAdminContentRepositories());
}

export async function getAdminPageContentService() {
  const guard = await getAdminGuardResult({
    hasAdminSession,
  });

  if (!guard.ok) {
    redirect(guard.redirectTo);
  }

  return createAdminContentService();
}

export async function requireAdminContentService() {
  await requireAdminMutationSession({
    hasAdminSession,
  });

  return createAdminContentService();
}
