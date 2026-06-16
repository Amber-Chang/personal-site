import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("readServerAdminAuthState resolves an allowlisted authenticated admin from Supabase user state", async () => {
  const authModule = await loadModule<{
    readServerAdminAuthState: (input: {
      cookies: () => Promise<{ getAll: () => Array<{ name: string; value: string }>; set: (...args: unknown[]) => void }>;
      createServerSupabaseClient: () => {
        auth: {
          getUser: () => Promise<{ data: { user: { email?: string | null } | null } }>;
        };
      };
      readSupabaseEnv: () => {
        adminAllowedEmails: string[];
      };
    }) => Promise<{
      isAdmin: boolean;
      isAuthenticated: boolean;
      normalizedEmail: string | null;
    }>;
  }>("./server-admin-auth.ts", "server admin auth");

  const result = await authModule.readServerAdminAuthState({
    cookies: async () => ({
      getAll: () => [],
      set: () => undefined,
    }),
    createServerSupabaseClient: () => ({
      auth: {
        getUser: async () => ({
          data: {
            user: {
              email: " Owner@Example.com ",
            },
          },
        }),
      },
    }),
    readSupabaseEnv: () => ({
      adminAllowedEmails: ["owner@example.com"],
    }),
  });

  assert.deepEqual(result, {
    isAdmin: true,
    isAuthenticated: true,
    normalizedEmail: "owner@example.com",
  });
});

test("readServerAdminAuthState returns unauthenticated state when Supabase has no user", async () => {
  const authModule = await loadModule<{
    readServerAdminAuthState: (input: {
      cookies: () => Promise<{ getAll: () => Array<{ name: string; value: string }>; set: (...args: unknown[]) => void }>;
      createServerSupabaseClient: () => {
        auth: {
          getUser: () => Promise<{ data: { user: { email?: string | null } | null } }>;
        };
      };
      readSupabaseEnv: () => {
        adminAllowedEmails: string[];
      };
    }) => Promise<{
      isAdmin: boolean;
      isAuthenticated: boolean;
      normalizedEmail: string | null;
    }>;
  }>("./server-admin-auth.ts", "server admin auth");

  const result = await authModule.readServerAdminAuthState({
    cookies: async () => ({
      getAll: () => [],
      set: () => undefined,
    }),
    createServerSupabaseClient: () => ({
      auth: {
        getUser: async () => ({
          data: {
            user: null,
          },
        }),
      },
    }),
    readSupabaseEnv: () => ({
      adminAllowedEmails: ["owner@example.com"],
    }),
  });

  assert.deepEqual(result, {
    isAdmin: false,
    isAuthenticated: false,
    normalizedEmail: null,
  });
});
