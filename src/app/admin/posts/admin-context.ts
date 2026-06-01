import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminGuardResult, requireAdminMutationSession } from "../../../lib/auth/guards.ts";
import { createBlogContentService } from "../../../lib/content/service.ts";
import { createAdminContentRepositories } from "../../../lib/infra/repositories/factory.ts";
import { readSupabaseEnv } from "../../../lib/infra/supabase/env.ts";
import { createServerSupabaseClient } from "../../../lib/infra/supabase/server.ts";

async function createSupabaseSessionClient() {
  const cookieStore = await cookies();

  return createServerSupabaseClient({
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookieValues) => {
        for (const cookie of cookieValues) {
          cookieStore.set(cookie.name, cookie.value, cookie.options);
        }
      },
    },
  }) as {
    auth: {
      getUser: () => Promise<{ data: { user: { email?: string | null } | null } }>;
    };
  };
}

async function getSessionUser() {
  const supabase = await createSupabaseSessionClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return null;
  }

  return {
    email: data.user.email ?? null,
  };
}

function createAdminContentService() {
  return createBlogContentService(createAdminContentRepositories());
}

export async function getAdminPageContentService() {
  const env = readSupabaseEnv();
  const guard = await getAdminGuardResult({
    allowedEmails: env.adminAllowedEmails,
    getUser: getSessionUser,
  });

  if (!guard.ok) {
    redirect(guard.redirectTo);
  }

  return createAdminContentService();
}

export async function requireAdminContentService() {
  const env = readSupabaseEnv();

  await requireAdminMutationSession({
    allowedEmails: env.adminAllowedEmails,
    getUser: getSessionUser,
  });

  return createAdminContentService();
}
