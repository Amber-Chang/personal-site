"use server";

import { cookies } from "next/headers";
import { headers } from "next/headers";

import { resolveAuthCallbackUrl } from "@/lib/auth/callback-url.ts";
import { createAdminLoginAction } from "@/lib/auth/login-action.ts";
import { requestAdminMagicLink } from "@/lib/auth/magic-link.ts";
import { readSupabaseEnv } from "@/lib/infra/supabase/env.ts";
import { createServerSupabaseClient } from "@/lib/infra/supabase/server.ts";
import type { AdminLoginFormState } from "./action-state.ts";

export async function requestAdminLogin(_state: AdminLoginFormState, formData: FormData): Promise<AdminLoginFormState> {
  const env = readSupabaseEnv();
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const supabase = createServerSupabaseClient({
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
      signInWithOtp: (input: {
        email: string;
        options: { emailRedirectTo: string };
      }) => Promise<{ error: Error | null }>;
    };
  };

  const action = createAdminLoginAction({
    adminAllowedEmails: env.adminAllowedEmails,
    emailRedirectTo: resolveAuthCallbackUrl({
      fallbackSiteUrl: env.siteUrl,
      headers: requestHeaders,
    }),
    requestAdminMagicLink,
    signInWithOtp: (payload) => supabase.auth.signInWithOtp(payload),
  });

  const result = await action(formData);

  return result.ok
    ? {
        ok: true,
        error: null,
      }
    : {
        ok: false,
        error: result.error,
      };
}
