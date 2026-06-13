import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminGuardResult, requireAdminMutationSession } from "../../../lib/auth/guards.ts";
import { hasActiveAdminSession } from "../../../lib/auth/session-server.ts";
import { requireTrustedAdminOrigin } from "../../../lib/auth/trusted-origin.ts";
import { createBlogContentService } from "../../../lib/content/service.ts";
import { createAdminContentRepositories } from "../../../lib/infra/repositories/factory.ts";

async function hasAdminSession() {
  const cookieStore = await cookies();

  return hasActiveAdminSession({
    cookieStore,
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
  await requireTrustedAdminOrigin();
  await requireAdminMutationSession({
    hasAdminSession,
  });

  return createAdminContentService();
}
