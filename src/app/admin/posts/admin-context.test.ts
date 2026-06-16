import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("getAdminPageContentService redirects unauthenticated users through the centralized admin guard", async () => {
  const adminContextModule = await loadModule<{
    createAdminContentAccess: <TService>(input: {
      createAdminContentService: () => TService;
      getAdminGuardResult: () => Promise<{ ok: true } | { ok: false; redirectTo: "/admin/login" }>;
      redirectTo: (path: "/admin/login") => never;
      requireAdminMutationSession: () => Promise<void>;
      requireTrustedAdminOrigin: () => Promise<void>;
    }) => {
      getAdminPageContentService: () => Promise<TService>;
      requireAdminContentService: () => Promise<TService>;
    };
  }>("./admin-context.ts", "admin content access");

  const access = adminContextModule.createAdminContentAccess({
    createAdminContentService: () => ({ ok: true }),
    getAdminGuardResult: async () => ({
      ok: false,
      redirectTo: "/admin/login",
    }),
    redirectTo: (path) => {
      throw new Error(`redirect:${path}`);
    },
    requireAdminMutationSession: async () => undefined,
    requireTrustedAdminOrigin: async () => undefined,
  });

  await assert.rejects(() => access.getAdminPageContentService(), /redirect:\/admin\/login/);
});

test("requireAdminContentService blocks mutations when the authenticated user is not an admin", async () => {
  const adminContextModule = await loadModule<{
    createAdminContentAccess: <TService>(input: {
      createAdminContentService: () => TService;
      getAdminGuardResult: () => Promise<{ ok: true } | { ok: false; redirectTo: "/admin/login" }>;
      redirectTo: (path: "/admin/login") => never;
      requireAdminMutationSession: () => Promise<void>;
      requireTrustedAdminOrigin: () => Promise<void>;
    }) => {
      getAdminPageContentService: () => Promise<TService>;
      requireAdminContentService: () => Promise<TService>;
    };
  }>("./admin-context.ts", "admin content access");

  const access = adminContextModule.createAdminContentAccess({
    createAdminContentService: () => ({ ok: true }),
    getAdminGuardResult: async () => ({ ok: true }),
    redirectTo: () => {
      throw new Error("redirect should not run");
    },
    requireAdminMutationSession: async () => {
      throw new Error("forbidden");
    },
    requireTrustedAdminOrigin: async () => undefined,
  });

  await assert.rejects(() => access.requireAdminContentService(), /forbidden/);
});

test("requireAdminContentService returns the admin service after origin and auth checks pass", async () => {
  const adminContextModule = await loadModule<{
    createAdminContentAccess: <TService>(input: {
      createAdminContentService: () => TService;
      getAdminGuardResult: () => Promise<{ ok: true } | { ok: false; redirectTo: "/admin/login" }>;
      redirectTo: (path: "/admin/login") => never;
      requireAdminMutationSession: () => Promise<void>;
      requireTrustedAdminOrigin: () => Promise<void>;
    }) => {
      getAdminPageContentService: () => Promise<TService>;
      requireAdminContentService: () => Promise<TService>;
    };
  }>("./admin-context.ts", "admin content access");

  const calls: string[] = [];
  const service = { ok: true };
  const access = adminContextModule.createAdminContentAccess({
    createAdminContentService: () => service,
    getAdminGuardResult: async () => ({ ok: true }),
    redirectTo: () => {
      throw new Error("redirect should not run");
    },
    requireAdminMutationSession: async () => {
      calls.push("auth");
    },
    requireTrustedAdminOrigin: async () => {
      calls.push("origin");
    },
  });

  const result = await access.requireAdminContentService();

  assert.deepEqual(calls, ["origin", "auth"]);
  assert.equal(result, service);
});
