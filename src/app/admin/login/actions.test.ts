import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("requestAdminLogin returns a controlled error when signInWithOAuth throws", async () => {
  const actionsModule = await loadModule<{
    createRequestAdminLoginAction: (input: {
      cookies: () => Promise<{ getAll: () => Array<{ name: string; value: string }>; set: (...args: unknown[]) => void }>;
      headers: () => Promise<Headers>;
      createServerSupabaseClient: () => {
        auth: {
          signInWithOAuth: (input: {
            provider: "google";
            options: {
              redirectTo: string;
              skipBrowserRedirect: true;
            };
          }) => Promise<{ data: { url: string | null }; error: Error | null }>;
        };
      };
      readSupabaseEnv: () => {
        siteUrl: string;
      };
      requireTrustedAdminOrigin: (input: { headers: Headers; siteUrl: string }) => Promise<void>;
      redirect: (url: string) => never;
    }) => (_state: { ok: boolean; error: string | null }, formData: FormData) => Promise<{ ok: boolean; error: string | null }>;
  }>("../../../lib/auth/admin-login-oauth-action.ts", "admin login actions");

  const action = actionsModule.createRequestAdminLoginAction({
    cookies: async () => ({
      getAll: () => [],
      set: () => undefined,
    }),
    headers: async () => new Headers({ host: "amberchang.com" }),
    createServerSupabaseClient: () => ({
      auth: {
        signInWithOAuth: async () => {
          throw new Error("provider down");
        },
      },
    }),
    readSupabaseEnv: () => ({
      siteUrl: "https://amberchang.com",
    }),
    requireTrustedAdminOrigin: async () => undefined,
    redirect: () => {
      throw new Error("redirect should not run");
    },
  });

  const result = await action({ ok: false, error: null }, new FormData());

  assert.deepEqual(result, {
    ok: false,
    error: "目前無法啟動 Google 登入，請稍後再試一次。",
  });
});
