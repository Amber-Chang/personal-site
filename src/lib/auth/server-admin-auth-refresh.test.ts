// 重現 production 問題：admin 的 access token 過期後，Server Component（每頁的 Header）讀登入狀態時，
// Supabase 換發新 token 並呼叫 setAll 寫 cookie，但 Server Component 裡的 cookies() 不能寫入，Next 會丟錯，整頁 500。
// 這裡用真正的 @supabase/ssr、Next 給 Server Component 的唯讀 cookie 物件，再把 Supabase Auth API 換成本機替身。

import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

import { readServerAdminAuthState } from "./server-admin-auth.ts";
import { createServerSupabaseClient } from "../infra/supabase/server.ts";

const require = createRequire(import.meta.url);
const { RequestCookies, ResponseCookies } = require("next/dist/server/web/spec-extension/cookies.js") as {
  RequestCookies: new (headers: Headers) => { getAll: () => Array<{ name: string; value: string }> };
  ResponseCookies: new (headers: Headers) => {
    getAll: () => Array<{ name: string; value: string }>;
    set: (name: string, value: string, options?: Record<string, unknown>) => void;
  };
};
const { RequestCookiesAdapter } = require("next/dist/server/web/spec-extension/adapters/request-cookies.js") as {
  RequestCookiesAdapter: { seal: <T>(cookies: T) => T };
};

const SUPABASE_URL = "https://stubref.supabase.co";
const COOKIE_NAME = "sb-stubref-auth-token";
const ADMIN_EMAIL = "owner@example.com";

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fakeJwt(payload: Record<string, unknown>) {
  return `${base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64Url(JSON.stringify(payload))}.signature`;
}

const USER = { aud: "authenticated", email: ADMIN_EMAIL, id: "user-1", role: "authenticated" };

// 和 @supabase/ssr 寫進瀏覽器的格式相同：base64- 開頭、base64url 編碼的 session JSON。
function expiredSessionCookie() {
  const expiredAt = Math.floor(Date.now() / 1000) - 600;
  const session = {
    access_token: fakeJwt({ exp: expiredAt, sub: USER.id }),
    expires_at: expiredAt,
    expires_in: 3600,
    refresh_token: "old-refresh-token",
    token_type: "bearer",
    user: USER,
  };

  return `${COOKIE_NAME}=base64-${base64Url(JSON.stringify(session))}`;
}

// Server Component 裡 cookies() 回傳的物件：讀得到，set 會丟 Next 的錯誤。
function serverComponentCookies(cookieHeader: string) {
  return RequestCookiesAdapter.seal(new RequestCookies(new Headers({ cookie: cookieHeader })));
}

// Server Action / Route Handler 裡可以寫入的 cookie 物件（記錄寫了什麼）。
function writableCookies(cookieHeader: string) {
  const store = new ResponseCookies(new Headers());

  for (const cookie of new RequestCookies(new Headers({ cookie: cookieHeader })).getAll()) {
    store.set(cookie.name, cookie.value);
  }

  const written: string[] = [];

  return {
    getAll: () => store.getAll(),
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      written.push(name);
      store.set(name, value, options);
    },
    written,
  };
}

// Supabase Auth API 的替身：refresh 成功或失敗、/user 回傳使用者。
function stubAuthApi(refresh: "ok" | "invalid") {
  const calls: string[] = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    calls.push(`${init?.method ?? "GET"} ${url.pathname}${url.search}`);

    if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
      if (refresh === "invalid") {
        return Response.json(
          { code: "refresh_token_not_found", error_code: "refresh_token_not_found", msg: "Invalid Refresh Token: Refresh Token Not Found" },
          { status: 400 },
        );
      }

      const expiresAt = Math.floor(Date.now() / 1000) + 3600;

      return Response.json({
        access_token: fakeJwt({ exp: expiresAt, sub: USER.id }),
        expires_at: expiresAt,
        expires_in: 3600,
        refresh_token: "new-refresh-token",
        token_type: "bearer",
        user: USER,
      });
    }

    if (url.pathname === "/auth/v1/user") {
      return Response.json(USER);
    }

    return Response.json({ msg: "unexpected request" }, { status: 500 });
  }) as typeof fetch;

  return {
    calls,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

function readState(cookies: () => Promise<{ getAll: () => Array<{ name: string; value: string }> }>) {
  return readServerAdminAuthState({
    cookies: cookies as never,
    createServerSupabaseClient: (input) =>
      createServerSupabaseClient({ ...input, env: { anonKey: "anon-key", url: SUPABASE_URL } }) as never,
    readSupabaseEnv: () => ({ adminAllowedEmails: [ADMIN_EMAIL] }),
  });
}

test("rendering with an expired but refreshable session returns the admin state instead of throwing", async () => {
  const api = stubAuthApi("ok");

  try {
    const state = await readState(async () => serverComponentCookies(expiredSessionCookie()));

    assert.deepEqual(state, { isAdmin: true, isAuthenticated: true, normalizedEmail: ADMIN_EMAIL });
    assert.equal(api.calls.filter((call) => call.startsWith("POST /auth/v1/token")).length, 1);
  } finally {
    api.restore();
  }
});

test("rendering with an invalid session returns a signed-out state instead of throwing", async () => {
  const api = stubAuthApi("invalid");

  try {
    const state = await readState(async () => serverComponentCookies(expiredSessionCookie()));

    assert.deepEqual(state, { isAdmin: false, isAuthenticated: false, normalizedEmail: null });
  } finally {
    api.restore();
  }
});

test("in a Server Action or Route Handler the refreshed session is still written to cookies", async () => {
  const api = stubAuthApi("ok");
  const store = writableCookies(expiredSessionCookie());

  try {
    const state = await readState(async () => store);

    assert.deepEqual(state, { isAdmin: true, isAuthenticated: true, normalizedEmail: ADMIN_EMAIL });
    assert.ok(store.written.includes(COOKIE_NAME), `expected ${COOKIE_NAME} to be rewritten, got ${store.written.join(", ")}`);
  } finally {
    api.restore();
  }
});

// 以下用 Supabase client 替身：getUser 期間呼叫 setAll（就像換發 token 時），檢查只略過 Next 的唯讀錯誤。
function stubClientThatWritesCookies(input: { cookies: { setAll: (cookies: Array<{ name: string; options?: Record<string, unknown>; value: string }>) => void } }) {
  return {
    auth: {
      getUser: async () => {
        input.cookies.setAll([{ name: COOKIE_NAME, options: { path: "/" }, value: "base64-refreshed" }]);
        return { data: { user: { email: ADMIN_EMAIL } } };
      },
    },
  };
}

test("only Next's read-only cookie error is ignored; the admin state is still returned", async () => {
  const state = await readServerAdminAuthState({
    cookies: async () => serverComponentCookies("") as never,
    createServerSupabaseClient: stubClientThatWritesCookies as never,
    readSupabaseEnv: () => ({ adminAllowedEmails: [ADMIN_EMAIL] }),
  });

  assert.deepEqual(state, { isAdmin: true, isAuthenticated: true, normalizedEmail: ADMIN_EMAIL });
});

test("cookie write errors other than Next's read-only error are not swallowed", async () => {
  await assert.rejects(
    () =>
      readServerAdminAuthState({
        cookies: async () => ({
          getAll: () => [],
          set: () => {
            throw new Error("disk full");
          },
        }),
        createServerSupabaseClient: stubClientThatWritesCookies as never,
        readSupabaseEnv: () => ({ adminAllowedEmails: [ADMIN_EMAIL] }),
      }),
    /disk full/,
  );
});
