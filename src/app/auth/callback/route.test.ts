import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

type CookieSetCall = {
  name: string;
  options: Record<string, unknown> | undefined;
  value: string;
};

function createCookieStore() {
  const setCalls: CookieSetCall[] = [];

  return {
    cookieStore: {
      getAll: () => [],
      set: (name: string, value: string, options?: Record<string, unknown>) => {
        setCalls.push({ name, options, value });
      },
    },
    setCalls,
  };
}

test("admin auth callback route redirects provider errors to a controlled login state", async () => {
  const routeModule = await loadModule<{
    createAdminAuthCallbackHandler: (input: {
      cookies: () => Promise<{ getAll: () => Array<{ name: string; value: string }>; set: (...args: unknown[]) => void }>;
      createServerSupabaseClient: () => {
        auth: {
          exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
          getUser: () => Promise<{ data: { user: { email?: string | null } | null } }>;
          signOut: () => Promise<{ error: Error | null }>;
        };
      };
      readSupabaseEnv: () => {
        adminAllowedEmails: string[];
        siteUrl: string;
      };
    }) => (request: Request) => Promise<Response>;
  }>("../../../lib/auth/admin-auth-callback-route.ts", "admin auth callback route");

  const { cookieStore, setCalls } = createCookieStore();
  const handler = routeModule.createAdminAuthCallbackHandler({
    cookies: async () => cookieStore,
    createServerSupabaseClient: () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: null }),
        getUser: async () => ({ data: { user: { email: "owner@example.com" } } }),
        signOut: async () => ({ error: null }),
      },
    }),
    readSupabaseEnv: () => ({
      adminAllowedEmails: ["owner@example.com"],
      siteUrl: "https://amberchang.com",
    }),
  });

  const response = await handler(new Request("https://amberchang.com/auth/callback?error=access_denied"));

  assert.equal(response.headers.get("location"), "https://amberchang.com/admin/login?error=oauth_cancelled");
  assert.equal(setCalls.length, 0);
});

test("admin auth callback route redirects authorized users into admin posts", async () => {
  const routeModule = await loadModule<{
    createAdminAuthCallbackHandler: (input: {
      cookies: () => Promise<{ getAll: () => Array<{ name: string; value: string }>; set: (...args: unknown[]) => void }>;
      createServerSupabaseClient: () => {
        auth: {
          exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
          getUser: () => Promise<{ data: { user: { email?: string | null } | null } }>;
          signOut: () => Promise<{ error: Error | null }>;
        };
      };
      readSupabaseEnv: () => {
        adminAllowedEmails: string[];
        siteUrl: string;
      };
    }) => (request: Request) => Promise<Response>;
  }>("../../../lib/auth/admin-auth-callback-route.ts", "admin auth callback route");

  const { cookieStore, setCalls } = createCookieStore();
  const handler = routeModule.createAdminAuthCallbackHandler({
    cookies: async () => cookieStore,
    createServerSupabaseClient: () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: null }),
        getUser: async () => ({ data: { user: { email: "owner@example.com" } } }),
        signOut: async () => ({ error: null }),
      },
    }),
    readSupabaseEnv: () => ({
      adminAllowedEmails: ["owner@example.com"],
      siteUrl: "https://amberchang.com",
    }),
  });

  const response = await handler(new Request("https://amberchang.com/auth/callback?code=valid-code"));

  assert.equal(response.headers.get("location"), "https://amberchang.com/admin/posts");
  assert.equal(setCalls.length, 0);
});

test("admin auth callback route redirects unauthorized users back to login", async () => {
  const routeModule = await loadModule<{
    createAdminAuthCallbackHandler: (input: {
      cookies: () => Promise<{ getAll: () => Array<{ name: string; value: string }>; set: (...args: unknown[]) => void }>;
      createServerSupabaseClient: () => {
        auth: {
          exchangeCodeForSession: (code: string) => Promise<{ error: Error | null }>;
          getUser: () => Promise<{ data: { user: { email?: string | null } | null } }>;
          signOut: () => Promise<{ error: Error | null }>;
        };
      };
      readSupabaseEnv: () => {
        adminAllowedEmails: string[];
        siteUrl: string;
      };
    }) => (request: Request) => Promise<Response>;
  }>("../../../lib/auth/admin-auth-callback-route.ts", "admin auth callback route");

  let signedOut = false;
  const { cookieStore, setCalls } = createCookieStore();
  const handler = routeModule.createAdminAuthCallbackHandler({
    cookies: async () => cookieStore,
    createServerSupabaseClient: () => ({
      auth: {
        exchangeCodeForSession: async () => ({ error: null }),
        getUser: async () => ({ data: { user: { email: "guest@example.com" } } }),
        signOut: async () => {
          signedOut = true;
          return { error: null };
        },
      },
    }),
    readSupabaseEnv: () => ({
      adminAllowedEmails: ["owner@example.com"],
      siteUrl: "https://amberchang.com",
    }),
  });

  const response = await handler(new Request("https://amberchang.com/auth/callback?code=valid-code"));

  assert.equal(response.headers.get("location"), "https://amberchang.com/admin/login?error=admin_not_allowed");
  assert.equal(signedOut, true);
  assert.equal(setCalls.length, 0);
});
