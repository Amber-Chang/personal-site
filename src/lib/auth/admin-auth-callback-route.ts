import { resolveAuthCallbackUrl } from "./callback-url.ts";
import { buildAdminLoginErrorRedirect, resolveAdminLoginErrorCodeFromCallback } from "./login-error.ts";
import { completeAdminAuthCallback } from "./magic-link.ts";
import type { SupabaseEnv } from "../infra/supabase/env.ts";

type CookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

type ServerSupabaseAuthClient = {
  auth: {
    exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
    getUser: () => Promise<{ data: { user: { email?: string | null } | null } }>;
    signOut: () => Promise<{ error: Error | null }>;
  };
};

export type AdminAuthCallbackDependencies = {
  cookies: () => Promise<CookieStore>;
  createServerSupabaseClient: (input: {
    cookies: {
      getAll: () => Array<{ name: string; value: string }>;
      setAll: (cookies: Array<{ name: string; options?: Record<string, unknown>; value: string }>) => void;
    };
  }) => ServerSupabaseAuthClient;
  readSupabaseEnv: () => Pick<SupabaseEnv, "adminAllowedEmails" | "siteUrl">;
};

export function createAdminAuthCallbackHandler(dependencies: AdminAuthCallbackDependencies) {
  return async function handleAdminAuthCallback(request: Request) {
    const env = dependencies.readSupabaseEnv();
    const cookieStore = await dependencies.cookies();
    const supabase = dependencies.createServerSupabaseClient({
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookieValues) => {
          for (const cookie of cookieValues) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    });

    const url = new URL(request.url);
    const callbackUrl = resolveAuthCallbackUrl({
      fallbackSiteUrl: env.siteUrl,
      requestUrl: request.url,
    });

    const providerError = url.searchParams.get("error");

    if (providerError) {
      return Response.redirect(
        new URL(
          buildAdminLoginErrorRedirect(
            resolveAdminLoginErrorCodeFromCallback({
              error: providerError,
            }),
          ),
          callbackUrl,
        ),
      );
    }

    const result = await completeAdminAuthCallback({
      allowedEmails: env.adminAllowedEmails,
      code: url.searchParams.get("code"),
      exchangeCodeForSession: (code) => supabase.auth.exchangeCodeForSession(code),
      getUser: async () => {
        const { data } = await supabase.auth.getUser();

        if (!data.user) {
          return null;
        }

        return {
          email: data.user.email ?? null,
        };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }
      },
    });

    return Response.redirect(new URL(result.redirectTo, callbackUrl));
  };
}
