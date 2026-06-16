import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("requestAdminLogout signs out Supabase, clears legacy admin session state, and redirects to login", async () => {
  const actionsModule = await loadModule<{
    createRequestAdminLogoutAction: (input: {
      clearActiveAdminSession: (input: {
        cookieStore: {
          get: (name: string) => { value: string } | undefined;
          getAll: () => Array<{ name: string; value: string }>;
          set: (name: string, value: string, options?: Record<string, unknown>) => void;
        };
      }) => Promise<void>;
      cookies: () => Promise<{
        get: (name: string) => { value: string } | undefined;
        getAll: () => Array<{ name: string; value: string }>;
        set: (name: string, value: string, options?: Record<string, unknown>) => void;
      }>;
      createServerSupabaseClient: () => {
        auth: {
          signOut: () => Promise<{ error: Error | null }>;
        };
      };
      headers: () => Promise<Headers>;
      readSupabaseEnv: () => {
        siteUrl: string;
      };
      redirect: (path: "/admin/login") => never;
      requireTrustedAdminOrigin: (input: { headers: Headers; siteUrl: string }) => Promise<void>;
    }) => () => Promise<void>;
  }>("./../../../lib/auth/admin-logout-action.ts", "admin logout action");

  const setCalls: Array<{ name: string; options?: Record<string, unknown>; value: string }> = [];
  const clearCalls: string[] = [];
  const redirectCalls: string[] = [];
  let signedOut = false;

  const action = actionsModule.createRequestAdminLogoutAction({
    clearActiveAdminSession: async () => {
      clearCalls.push("legacy-session");
    },
    cookies: async () => ({
      get: () => ({ value: "legacy-token" }),
      getAll: () => [{ name: "sb-access-token", value: "token" }],
      set: (name, value, options) => {
        setCalls.push({ name, value, options });
      },
    }),
    createServerSupabaseClient: () => ({
      auth: {
        signOut: async () => {
          signedOut = true;
          return { error: null };
        },
      },
    }),
    headers: async () => new Headers({ origin: "https://amberchang.com" }),
    readSupabaseEnv: () => ({
      siteUrl: "https://amberchang.com",
    }),
    redirect: (path) => {
      redirectCalls.push(path);
      throw new Error(`redirect:${path}`);
    },
    requireTrustedAdminOrigin: async () => undefined,
  });

  await assert.rejects(() => action(), /redirect:\/admin\/login/);

  assert.equal(signedOut, true);
  assert.deepEqual(clearCalls, ["legacy-session"]);
  assert.equal(redirectCalls[0], "/admin/login");
  assert.equal(setCalls.some((call) => call.name === "admin_session" && call.value === ""), true);
});

test("requestAdminLogout still clears legacy session state and redirects when Supabase signOut fails", async () => {
  const actionsModule = await loadModule<{
    createRequestAdminLogoutAction: (input: {
      clearActiveAdminSession: (input: {
        cookieStore: {
          get: (name: string) => { value: string } | undefined;
          getAll: () => Array<{ name: string; value: string }>;
          set: (name: string, value: string, options?: Record<string, unknown>) => void;
        };
      }) => Promise<void>;
      cookies: () => Promise<{
        get: (name: string) => { value: string } | undefined;
        getAll: () => Array<{ name: string; value: string }>;
        set: (name: string, value: string, options?: Record<string, unknown>) => void;
      }>;
      createServerSupabaseClient: () => {
        auth: {
          signOut: () => Promise<{ error: Error | null }>;
        };
      };
      headers: () => Promise<Headers>;
      readSupabaseEnv: () => {
        siteUrl: string;
      };
      redirect: (path: "/admin/login") => never;
      requireTrustedAdminOrigin: (input: { headers: Headers; siteUrl: string }) => Promise<void>;
    }) => () => Promise<void>;
  }>("./../../../lib/auth/admin-logout-action.ts", "admin logout action");

  const setCalls: Array<{ name: string; options?: Record<string, unknown>; value: string }> = [];
  const clearCalls: string[] = [];
  const redirectCalls: string[] = [];

  const action = actionsModule.createRequestAdminLogoutAction({
    clearActiveAdminSession: async () => {
      clearCalls.push("legacy-session");
    },
    cookies: async () => ({
      get: () => ({ value: "legacy-token" }),
      getAll: () => [{ name: "sb-access-token", value: "token" }],
      set: (name, value, options) => {
        setCalls.push({ name, value, options });
      },
    }),
    createServerSupabaseClient: () => ({
      auth: {
        signOut: async () => ({
          error: new Error("provider down"),
        }),
      },
    }),
    headers: async () => new Headers({ origin: "https://amberchang.com" }),
    readSupabaseEnv: () => ({
      siteUrl: "https://amberchang.com",
    }),
    redirect: (path) => {
      redirectCalls.push(path);
      throw new Error(`redirect:${path}`);
    },
    requireTrustedAdminOrigin: async () => undefined,
  });

  await assert.rejects(() => action(), /redirect:\/admin\/login/);

  assert.deepEqual(clearCalls, ["legacy-session"]);
  assert.equal(redirectCalls[0], "/admin/login");
  assert.equal(setCalls.some((call) => call.name === "admin_session" && call.value === ""), true);
});
