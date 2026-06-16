import { redirect } from "next/navigation.js";

import { getAdminGuardResult, requireAdminMutationSession } from "../../../lib/auth/guards.ts";
import { readServerAdminAuthState } from "../../../lib/auth/server-admin-auth.ts";
import { requireTrustedAdminOrigin } from "../../../lib/auth/trusted-origin.ts";
import { createBlogContentService } from "../../../lib/content/service.ts";
import { createAdminContentRepositories } from "../../../lib/infra/repositories/factory.ts";

function createAdminContentService() {
  return createBlogContentService(createAdminContentRepositories());
}

export function createAdminContentAccess<TService>(input: {
  createAdminContentService: () => TService;
  getAdminGuardResult: () => Promise<{ ok: true } | { ok: false; redirectTo: "/admin/login" }>;
  redirectTo: (path: "/admin/login") => never;
  requireAdminMutationSession: () => Promise<void>;
  requireTrustedAdminOrigin: () => Promise<void>;
}) {
  return {
    async getAdminPageContentService() {
      const guard = await input.getAdminGuardResult();

      if (!guard.ok) {
        input.redirectTo(guard.redirectTo);
      }

      return input.createAdminContentService();
    },
    async requireAdminContentService() {
      await input.requireTrustedAdminOrigin();
      await input.requireAdminMutationSession();

      return input.createAdminContentService();
    },
  };
}

const defaultAdminContentAccess = createAdminContentAccess({
  createAdminContentService,
  getAdminGuardResult: () =>
    getAdminGuardResult({
      getAdminAuthState: readServerAdminAuthState,
    }),
  redirectTo: redirect,
  requireAdminMutationSession: () =>
    requireAdminMutationSession({
      getAdminAuthState: readServerAdminAuthState,
    }),
  requireTrustedAdminOrigin,
});

export const getAdminPageContentService = defaultAdminContentAccess.getAdminPageContentService;
export const requireAdminContentService = defaultAdminContentAccess.requireAdminContentService;
