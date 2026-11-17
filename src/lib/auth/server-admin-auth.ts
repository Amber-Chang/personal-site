import { getAdminAuthState, type AdminAuthState } from "./guards.ts";
import type { SupabaseEnv } from "../infra/supabase/env.ts";
import { readSupabaseEnv } from "../infra/supabase/env.ts";
import { createServerSupabaseClient } from "../infra/supabase/server.ts";

type CookieStore = {
  getAll: () => Array<{ name: string; value: string }>;
  set: (name: string, value: string, options?: Record<string, unknown>) => void;
};

// Next.js 在 Server Component 渲染時不允許寫 cookie，cookies().set 會丟出這個訊息開頭的錯誤。
const READONLY_COOKIES_ERROR_PREFIX = "Cookies can only be modified in a Server Action or Route Handler";

export function isReadonlyCookiesError(error: unknown): boolean {
  return error instanceof Error && error.message.startsWith(READONLY_COOKIES_ERROR_PREFIX);
}

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
  const cookieAdapter = {
    getAll: () => cookieStore.getAll(),
    // Supabase 換發或清除 session 時會呼叫 setAll。
    // Server Action、Route Handler 可以寫 cookie，照常寫入。
    // Server Component 渲染時（例如後台頁面的 guard、/admin/login）不能寫，Next 會丟錯；這時略過寫入、仍然回傳登入狀態，
    // 不讓整頁變成錯誤頁。新的 token 由 src/proxy.ts 在渲染前寫回瀏覽器。其他錯誤照常丟出。
    setAll: (cookieValues: Array<{ name: string; options?: Record<string, unknown>; value: string }>) => {
      for (const cookie of cookieValues) {
        try {
          cookieStore.set(cookie.name, cookie.value, cookie.options);
        } catch (error) {
          if (!isReadonlyCookiesError(error)) {
            throw error;
          }
        }
      }
    },
  };
  const supabase = (input?.createServerSupabaseClient?.({ cookies: cookieAdapter }) ??
    createServerSupabaseClient({ cookies: cookieAdapter })) as ServerSupabaseAuthClient;

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
