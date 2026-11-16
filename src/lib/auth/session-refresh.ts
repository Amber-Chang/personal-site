// 功能：在頁面渲染前換發快過期或已過期的 Supabase 登入 session，並把新的 cookie 同時交給這次渲染與瀏覽器。
// 由 src/proxy.ts 呼叫。Server Component 渲染時不能寫 cookie，所以換發一定要在這裡（渲染前）做，新的 token 才存得下來。
// 只做換發：不判斷誰可以進後台、不轉址、不擋請求，權限仍由既有的 guard 負責。

import { NextResponse, type NextRequest } from "next/server.js";

import type { SupabaseCookieAdapter } from "../infra/supabase/server.ts";

type RequestCookie = { name: string; value: string };
type CookieToSet = { name: string; options?: Record<string, unknown>; value: string };

type SessionRefreshClient = {
  auth: {
    getUser: () => Promise<unknown>;
  };
};

export type SessionRefreshDependencies = {
  createServerSupabaseClient: (input: { cookies: SupabaseCookieAdapter }) => unknown;
  logError?: (message: string, error?: unknown) => void;
  // 換發最多等多久；Supabase 連不上時 supabase-js 會重試到約 30 秒，這裡不讓請求一直卡著。
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 5000;

// Supabase 的登入 session cookie：sb-<專案代號>-auth-token，太長時分成 .0、.1… 多個。不含 PKCE 的 code-verifier。
const SESSION_COOKIE_PATTERN = /^sb-.+-auth-token(?:\.\d+)?$/;

// 只處理帶著 session cookie 的 GET／HEAD（頁面瀏覽、換頁時的資料請求）。
// Server Action 與 Route Handler 的 POST（登入、登出、後台寫入、圖片上傳）本來就能自己寫 cookie，維持原本的流程。
export function shouldRefreshSession(input: { cookies: RequestCookie[]; method: string }): boolean {
  if (input.method !== "GET" && input.method !== "HEAD") {
    return false;
  }

  return input.cookies.some((cookie) => SESSION_COOKIE_PATTERN.test(cookie.name));
}

// 用目前的 cookie 建一個 Supabase client，呼叫 getUser()：access token 過期時它會換發（成功時寫入新的 session，
// refresh token 無效時清掉 session）。收集它要寫的 cookie 與標頭，不在這裡套用。
async function collectSessionCookieChanges(cookies: RequestCookie[], dependencies: SessionRefreshDependencies) {
  const current = new Map(cookies.map((cookie) => [cookie.name, cookie.value]));
  const cookiesToSet: CookieToSet[] = [];
  let headers: Record<string, string> = {};

  const client = dependencies.createServerSupabaseClient({
    cookies: {
      getAll: () => [...current].map(([name, value]) => ({ name, value })),
      setAll: (values, responseHeaders) => {
        for (const cookie of values) {
          if (cookie.value) {
            current.set(cookie.name, cookie.value);
          } else {
            current.delete(cookie.name);
          }

          cookiesToSet.push(cookie);
        }

        headers = { ...headers, ...responseHeaders };
      },
    },
  }) as SessionRefreshClient;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<"timeout">((resolve) => {
    timer = setTimeout(() => resolve("timeout"), dependencies.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([client.auth.getUser().then(() => "done" as const), timeout]);

    if (result === "timeout") {
      dependencies.logError?.("[session-refresh] Supabase did not answer in time; continuing without refreshing.");
      return { cookiesToSet: [], headers: {} };
    }
  } catch (error) {
    // 預期外的錯誤（例如 Supabase 連不上）：不改 cookie，讓請求照常往下走。
    dependencies.logError?.("[session-refresh] failed to refresh the Supabase session.", error);
    return { cookiesToSet: [], headers: {} };
  } finally {
    clearTimeout(timer);
  }

  return { cookiesToSet: [...cookiesToSet], headers };
}

export function createSessionRefreshProxy(dependencies: SessionRefreshDependencies) {
  const logError = dependencies.logError ?? ((message: string, error?: unknown) => console.error(message, error));

  return async function refreshSessionBeforeRender(request: NextRequest): Promise<NextResponse> {
    const cookies = request.cookies.getAll();

    // 一般訪客（沒有 session cookie）直接放行，不呼叫 Supabase。
    if (!shouldRefreshSession({ cookies, method: request.method })) {
      return NextResponse.next();
    }

    const { cookiesToSet, headers } = await collectSessionCookieChanges(cookies, { ...dependencies, logError });

    if (cookiesToSet.length === 0) {
      return NextResponse.next();
    }

    // 1. 改這次請求的 cookie：後面的渲染讀到的是新的 token（或已清掉的 session），不會再換發一次。
    for (const cookie of cookiesToSet) {
      if (cookie.value) {
        request.cookies.set(cookie.name, cookie.value);
      } else {
        request.cookies.delete(cookie.name);
      }
    }

    const response = NextResponse.next({ request: { headers: request.headers } });

    // 2. 寫回瀏覽器：換發成功時存新的 session；refresh token 無效時清掉，瀏覽器不會每頁一直重試。
    //    清除時同時帶 Expires=1970：頁面在渲染中轉址（例如未登入進 /admin/posts）時，Next 會重新輸出這個 Set-Cookie，
    //    但它的 cookie 解析器會丟掉 Max-Age=0，只剩空值會讓瀏覽器留下一個空的 session cookie。
    for (const cookie of cookiesToSet) {
      response.cookies.set(cookie.name, cookie.value, cookie.value ? cookie.options : { ...cookie.options, expires: new Date(0) });
    }

    // 帶有 Set-Cookie 的回應不能被快取（@supabase/ssr 提供的 Cache-Control 等標頭）。
    for (const [name, value] of Object.entries(headers)) {
      response.headers.set(name, value);
    }

    return response;
  };
}
