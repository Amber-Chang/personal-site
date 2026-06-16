import { getAdminAuthState, type AdminAuthState } from "./guards.ts";
import type { SupabaseEnv } from "../infra/supabase/env.ts";
import { readSupabaseEnv } from "../infra/supabase/env.ts";
import { createServerSupabaseClient } from "../infra/supabase/server.ts";

type CookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

type ServerSupabaseAuthClient = {
  auth: {
    getUser: () => Promise<{ data: { user: { email?: string | null } | null } }>;
  };
};

export async function readServerAdminAuthState(input?: {
  cookies?: () => Promise<CookieStore>;
  createServerSupabaseClient?: (input: {
    cookies: {
      getAll: () => Array<{ name: string; value: string }>;
      setAll: (cookies: Array<{ name: string; options?: Record<string, unknown>; value: string }>) => void;
    };
  }) => ServerSupabaseAuthClient;
  readSupabaseEnv?: () => Pick<SupabaseEnv, "adminAllowedEmails">;
}): Promise<AdminAuthState> {
  const env = input?.readSupabaseEnv?.() ?? readSupabaseEnv();
  const resolvedCookies =
    input?.cookies ??
    (async () => {
      const { cookies } = await import("next/headers.js");
      return cookies();
    });
  const cookieStore = await resolvedCookies();
  const supabase = (input?.createServerSupabaseClient?.({
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookieValues) => {
          for (const cookie of cookieValues) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    }) ??
    createServerSupabaseClient({
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookieValues) => {
          for (const cookie of cookieValues) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    })) as ServerSupabaseAuthClient;

  return getAdminAuthState({
    allowedEmails: env.adminAllowedEmails,
    getSessionUser: async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        return null;
      }

      return {
        email: data.user.email ?? null,
      };
    },
  });
}
