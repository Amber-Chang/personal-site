// 渲染前換發 Supabase session（src/proxy.ts）的測試：用真正的 @supabase/ssr 與 Next 的 NextRequest／NextResponse，
// Supabase Auth API 換成本機替身，不需要真的登入。

import assert from "node:assert/strict";
import { AsyncLocalStorage } from "node:async_hooks";
import { createRequire } from "node:module";
import test from "node:test";

import { NextRequest } from "next/server.js";

import { createServerSupabaseClient } from "../infra/supabase/server.ts";
import { readServerAdminAuthState } from "./server-admin-auth.ts";

type SessionRefreshModule = {
  createSessionRefreshProxy: (dependencies: {
    createServerSupabaseClient: typeof createServerSupabaseClient;
    logError?: (message: string, error?: unknown) => void;
    timeoutMs?: number;
  }) => (request: NextRequest) => Promise<Response>;
  shouldRefreshSession: (input: { cookies: Array<{ name: string; value: string }>; method: string }) => boolean;
};

async function loadModule(): Promise<SessionRefreshModule> {
  const loadedModule = await import("./session-refresh.ts").catch(() => null);

  assert.ok(loadedModule, "expected session refresh module to exist at ./session-refresh.ts");

  return loadedModule as unknown as SessionRefreshModule;
}

const require = createRequire(import.meta.url);
const { RequestCookies } = require("next/dist/server/web/spec-extension/cookies.js") as {
  RequestCookies: new (headers: Headers) => { getAll: () => Array<{ name: string; value: string }> };
};
const { RequestCookiesAdapter } = require("next/dist/server/web/spec-extension/adapters/request-cookies.js") as {
  RequestCookiesAdapter: { seal: <T>(cookies: T) => T };
};

const SUPABASE_URL = "https://stubref.supabase.co";
const COOKIE_NAME = "sb-stubref-auth-token";
const ADMIN_EMAIL = "owner@example.com";
const USER = { aud: "authenticated", email: ADMIN_EMAIL, id: "user-1", role: "authenticated" };

const b64 = (value: string) => Buffer.from(value).toString("base64url");
const fakeJwt = (payload: Record<string, unknown>) =>
  `${b64(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64(JSON.stringify(payload))}.signature`;

function sessionCookieValue(expiresAt: number, refreshToken: string) {
  return `base64-${b64(
    JSON.stringify({
      access_token: fakeJwt({ exp: expiresAt, sub: USER.id }),
      expires_at: expiresAt,
      expires_in: 3600,
      refresh_token: refreshToken,
      token_type: "bearer",
      user: USER,
    }),
  )}`;
}

const expiredCookie = () => `${COOKIE_NAME}=${sessionCookieValue(Math.floor(Date.now() / 1000) - 600, "old-refresh-token")}`;

function stubAuthApi(refresh: "ok" | "invalid") {
  const calls: string[] = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    calls.push(`${init?.method ?? "GET"} ${url.pathname}`);

    if (url.pathname === "/auth/v1/token") {
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
    refreshCalls: () => calls.filter((call) => call === "POST /auth/v1/token").length,
    restore: () => {
      globalThis.fetch = originalFetch;
    },
  };
}

const createClient: typeof createServerSupabaseClient = (input) =>
  createServerSupabaseClient({ ...input, env: { anonKey: "anon-key", url: SUPABASE_URL } });

function request(path: string, init?: { cookie?: string; method?: string }) {
  return new NextRequest(`http://localhost:3124${path}`, {
    headers: init?.cookie ? { cookie: init.cookie } : {},
    method: init?.method ?? "GET",
  });
}

// Next 把 proxy 改過的 request cookie 放在 x-middleware-request-cookie，交給後面的渲染使用。
function renderCookiesFrom(response: Response, fallbackCookie: string) {
  const forwarded = response.headers.get("x-middleware-request-cookie") ?? fallbackCookie;

  return RequestCookiesAdapter.seal(new RequestCookies(new Headers({ cookie: forwarded })));
}

function readRenderState(response: Response, fallbackCookie: string) {
  return readServerAdminAuthState({
    cookies: async () => renderCookiesFrom(response, fallbackCookie) as never,
    createServerSupabaseClient: createClient as never,
    readSupabaseEnv: () => ({ adminAllowedEmails: [ADMIN_EMAIL] }),
  });
}

test("only GET and HEAD requests that carry a Supabase session cookie are refreshed", async () => {
  const { shouldRefreshSession } = await loadModule();
  const session = [{ name: COOKIE_NAME, value: "base64-x" }];

  assert.equal(shouldRefreshSession({ cookies: session, method: "GET" }), true);
  assert.equal(shouldRefreshSession({ cookies: session, method: "HEAD" }), true);
  assert.equal(shouldRefreshSession({ cookies: [{ name: `${COOKIE_NAME}.0`, value: "base64-x" }], method: "GET" }), true);
  // Server Action 與 Route Handler 的 POST 自己會寫 cookie（登入、登出、後台寫入、上傳），proxy 不介入。
  assert.equal(shouldRefreshSession({ cookies: session, method: "POST" }), false);
  assert.equal(shouldRefreshSession({ cookies: [{ name: `${COOKIE_NAME}-code-verifier`, value: "x" }], method: "GET" }), false);
  assert.equal(shouldRefreshSession({ cookies: [{ name: "analytics-consent", value: "rejected" }], method: "GET" }), false);
  assert.equal(shouldRefreshSession({ cookies: [], method: "GET" }), false);
});

test("a request without a Supabase session cookie passes straight through with no Supabase call", async () => {
  const { createSessionRefreshProxy } = await loadModule();
  let created = 0;
  const proxy = createSessionRefreshProxy({
    createServerSupabaseClient: ((input: Parameters<typeof createServerSupabaseClient>[0]) => {
      created += 1;
      return createClient(input);
    }) as typeof createServerSupabaseClient,
  });
  const api = stubAuthApi("ok");

  try {
    const response = await proxy(request("/blog", { cookie: "analytics-consent=rejected" }));

    assert.equal(created, 0);
    assert.deepEqual(api.calls, []);
    assert.equal(response.headers.get("x-middleware-next"), "1");
    assert.equal(response.headers.get("set-cookie"), null);
    assert.equal(response.headers.get("x-middleware-request-cookie"), null);
  } finally {
    api.restore();
  }
});

test("an expired but refreshable session is refreshed once, stored in the browser and seen by the render", async () => {
  const { createSessionRefreshProxy } = await loadModule();
  const api = stubAuthApi("ok");

  try {
    const response = await createSessionRefreshProxy({ createServerSupabaseClient: createClient })(
      request("/admin/posts", { cookie: expiredCookie() }),
    );

    assert.equal(api.refreshCalls(), 1);
    // 瀏覽器會收到新的 session cookie，且不會被快取。
    assert.match(response.headers.get("set-cookie") ?? "", new RegExp(`^${COOKIE_NAME}=base64-`));
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    // 這次渲染拿到的是新的 token：讀登入狀態是管理員，而且不會再換發一次。
    assert.notEqual(response.headers.get("x-middleware-request-cookie"), null);
    assert.deepEqual(await readRenderState(response, expiredCookie()), {
      isAdmin: true,
      isAuthenticated: true,
      normalizedEmail: ADMIN_EMAIL,
    });
    assert.equal(api.refreshCalls(), 1);
  } finally {
    api.restore();
  }
});

test("an invalid session is cleared in the browser and the request continues signed out", async () => {
  const { createSessionRefreshProxy } = await loadModule();
  const api = stubAuthApi("invalid");

  try {
    const response = await createSessionRefreshProxy({ createServerSupabaseClient: createClient })(
      request("/", { cookie: `${expiredCookie()}; analytics-consent=rejected` }),
    );
    const setCookie = response.headers.get("set-cookie") ?? "";

    assert.equal(api.refreshCalls(), 1);
    assert.match(setCookie, new RegExp(`^${COOKIE_NAME}=;`));
    assert.match(setCookie, /Max-Age=0/);
    // 同時帶 Expires=1970：Next 在渲染中轉址時會重新輸出這個 Set-Cookie，而它的解析器會丟掉 Max-Age=0，
    // 只剩空值時瀏覽器會留下一個空的 session cookie。
    assert.match(setCookie, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
    // 交給渲染的 cookie 已經沒有 session，其他 cookie 保留；渲染時當成未登入，不再呼叫 Supabase。
    const forwarded = response.headers.get("x-middleware-request-cookie") ?? "";

    assert.doesNotMatch(forwarded, new RegExp(COOKIE_NAME));
    assert.match(forwarded, /analytics-consent=rejected/);
    assert.equal(response.headers.get("location"), null);
    assert.deepEqual(await readRenderState(response, ""), { isAdmin: false, isAuthenticated: false, normalizedEmail: null });
    assert.equal(api.refreshCalls(), 1);
  } finally {
    api.restore();
  }
});

test("an unexpected error during refresh leaves the cookies alone and never breaks the request", async () => {
  const { createSessionRefreshProxy } = await loadModule();
  const logged: string[] = [];
  const response = await createSessionRefreshProxy({
    createServerSupabaseClient: (() => ({
      auth: {
        getUser: async () => {
          throw new TypeError("fetch failed");
        },
      },
    })) as never,
    logError: (message) => logged.push(message),
  })(request("/", { cookie: expiredCookie() }));

  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(logged.length, 1);
});

test("if Supabase does not answer in time the request continues unchanged", async () => {
  const { createSessionRefreshProxy } = await loadModule();
  const logged: string[] = [];
  const startedAt = Date.now();
  // supabase-js 遇到連線錯誤會重試到約 30 秒；proxy 只等 timeoutMs（預設 5 秒），之後照常放行。
  const response = await createSessionRefreshProxy({
    createServerSupabaseClient: (() => ({ auth: { getUser: () => new Promise(() => {}) } })) as never,
    logError: (message) => logged.push(message),
    timeoutMs: 50,
  })(request("/", { cookie: expiredCookie() }));

  assert.ok(Date.now() - startedAt < 1000);
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("set-cookie"), null);
  assert.equal(logged.length, 1);
});

test("the proxy never redirects or blocks: it only refreshes the session", async () => {
  const source = (await import("node:fs")).readFileSync(new URL("./session-refresh.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /NextResponse\.redirect|NextResponse\.rewrite|status: 40[13]/);
  assert.doesNotMatch(source, /isAllowedAdminEmail|adminAllowedEmails/);
});

test("the proxy runs on pages and skips static files, images, the OG image, robots, sitemap, auth callbacks and the cron route", async () => {
  (globalThis as { AsyncLocalStorage?: unknown }).AsyncLocalStorage = AsyncLocalStorage;

  const { unstable_doesMiddlewareMatch } = (await import("next/experimental/testing/server.js")) as {
    unstable_doesMiddlewareMatch: (input: { config: { matcher?: unknown }; url: string }) => boolean;
  };
  const { config } = (await import("../../proxy.ts")) as { config: { matcher: unknown } };
  const matches = (url: string) => unstable_doesMiddlewareMatch({ config, url });

  for (const url of ["/", "/blog", "/blog/a-post", "/projects/a-project", "/about", "/admin/login", "/admin/posts", "/admin/posts/1"]) {
    assert.equal(matches(url), true, url);
  }

  for (const url of [
    "/_next/static/chunks/main.js",
    "/_next/image?url=%2Famber-avatar.png&w=96&q=75",
    "/amber-avatar.png",
    "/icon.png",
    "/opengraph-image",
    "/opengraph-image-1a2b3c",
    "/robots.txt",
    "/sitemap.xml",
    "/auth/callback",
    "/auth/client-callback",
    "/api/cron/supabase-keep-alive",
  ]) {
    assert.equal(matches(url), false, url);
  }
});
