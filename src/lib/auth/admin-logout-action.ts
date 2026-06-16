import { ADMIN_SESSION_COOKIE_NAME, ADMIN_SESSION_COOKIE_OPTIONS } from "./session.ts";

type CookieStore = {
  get: (name: string) => { value: string } | undefined;
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

type ServerSupabaseAuthClient = {
  auth: {
    signOut: () => Promise<{ error: Error | null }>;
  };
};

export function createRequestAdminLogoutAction(input: {
  clearActiveAdminSession: (input: { cookieStore: CookieStore }) => Promise<void>;
  cookies: () => Promise<CookieStore>;
  createServerSupabaseClient: (input: {
    cookies: {
      getAll: () => Array<{ name: string; value: string }>;
      setAll: (cookies: Array<{ name: string; options?: Record<string, unknown>; value: string }>) => void;
    };
  }) => ServerSupabaseAuthClient;
  headers: () => Promise<Headers>;
  readSupabaseEnv: () => {
    siteUrl: string;
  };
  redirect: (path: "/admin/login") => never;
  requireTrustedAdminOrigin: (input: { headers: Headers; siteUrl: string }) => Promise<void>;
}) {
  return async function requestAdminLogout() {
    const env = input.readSupabaseEnv();
    const requestHeaders = await input.headers();
    const cookieStore = await input.cookies();

    await input.requireTrustedAdminOrigin({
      headers: requestHeaders,
      siteUrl: env.siteUrl,
    });

    const supabase = input.createServerSupabaseClient({
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookieValues) => {
          for (const cookie of cookieValues) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    });
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("admin logout supabase sign out failed", error);
    }

    await input.clearActiveAdminSession({
      cookieStore,
    });

    cookieStore.set(ADMIN_SESSION_COOKIE_NAME, "", {
      ...ADMIN_SESSION_COOKIE_OPTIONS,
      maxAge: 0,
    });

    input.redirect("/admin/login");
  };
}
