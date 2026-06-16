import { resolveAuthCallbackUrl } from "./callback-url.ts";
import type { SupabaseEnv } from "../infra/supabase/env.ts";

export type AdminLoginFormState = {
  error: string | null;
  ok: boolean;
};

type CookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

type ServerSupabaseAuthClient = {
  auth: {
    signInWithOAuth: (input: {
      provider: "google";
      options: {
        redirectTo: string;
        skipBrowserRedirect: true;
      };
    }) => Promise<{
      data: {
        url: string | null;
      };
      error: Error | null;
    }>;
  };
};

export type RequestAdminLoginActionDependencies = {
  cookies: () => Promise<CookieStore>;
  headers: () => Promise<Headers>;
  createServerSupabaseClient: (input: {
    cookies: {
      getAll: () => Array<{ name: string; value: string }>;
      setAll: (cookies: Array<{ name: string; options?: Record<string, unknown>; value: string }>) => void;
    };
  }) => ServerSupabaseAuthClient;
  readSupabaseEnv: () => Pick<SupabaseEnv, "siteUrl">;
  redirect: (url: string) => never;
  requireTrustedAdminOrigin: (input: { headers: Headers; siteUrl: string }) => Promise<void>;
};

export function createRequestAdminLoginAction(dependencies: RequestAdminLoginActionDependencies) {
  return async function requestAdminLogin(_state: AdminLoginFormState, _formData: FormData): Promise<AdminLoginFormState> {
    void _state;
    void _formData;

    const env = dependencies.readSupabaseEnv();
    const cookieStore = await dependencies.cookies();
    const requestHeaders = await dependencies.headers();

    try {
      await dependencies.requireTrustedAdminOrigin({
        headers: requestHeaders,
        siteUrl: env.siteUrl,
      });
    } catch {
      return {
        ok: false,
        error: "請從本站重新開啟登入頁後再試一次。",
      };
    }

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

    const callbackUrl = resolveAuthCallbackUrl({
      fallbackSiteUrl: env.siteUrl,
      headers: requestHeaders,
    });

    let oauthUrl: string | null = null;

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error || !data.url) {
        return {
          ok: false,
          error: "目前無法啟動 Google 登入，請稍後再試一次。",
        };
      }

      oauthUrl = data.url;
    } catch {
      return {
        ok: false,
        error: "目前無法啟動 Google 登入，請稍後再試一次。",
      };
    }

    dependencies.redirect(oauthUrl);
  };
}
