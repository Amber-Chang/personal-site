import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { resolveAuthCallbackUrl } from "@/lib/auth/callback-url.ts";
import { completeAdminAuthCallback } from "@/lib/auth/magic-link.ts";
import { readSupabaseEnv } from "@/lib/infra/supabase/env.ts";
import { createServerSupabaseClient } from "@/lib/infra/supabase/server.ts";

export async function GET(request: Request) {
  const env = readSupabaseEnv();
  const cookieStore = await cookies();
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
      exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
      getUser: () => Promise<{ data: { user: { email?: string | null } | null } }>;
      signOut: () => Promise<void>;
    };
  };

  const url = new URL(request.url);
  const result = await completeAdminAuthCallback({
    allowedEmails: env.adminAllowedEmails,
    code: url.searchParams.get("code"),
    exchangeCodeForSession: supabase.auth.exchangeCodeForSession,
    getUser: async () => {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        return null;
      }

      return {
        email: data.user.email ?? null,
      };
    },
    signOut: supabase.auth.signOut,
  });

  const callbackUrl = resolveAuthCallbackUrl({
    fallbackSiteUrl: env.siteUrl,
    requestUrl: request.url,
  });

  return NextResponse.redirect(new URL(result.redirectTo, callbackUrl));
}
