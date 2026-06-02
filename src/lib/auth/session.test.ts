import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("hasValidAdminSessionToken accepts the matching password token", async () => {
  const sessionModule = await loadModule<{
    createAdminSessionToken: (adminPassword: string) => string;
    hasValidAdminSessionToken: (input: { adminPassword: string; sessionToken: string | null | undefined }) => boolean;
  }>("./session.ts", "admin session");

  const sessionToken = sessionModule.createAdminSessionToken("super-secret");

  assert.equal(
    sessionModule.hasValidAdminSessionToken({
      adminPassword: "super-secret",
      sessionToken,
    }),
    true,
  );
});

test("hasValidAdminSessionToken rejects mismatched tokens", async () => {
  const sessionModule = await loadModule<{
    hasValidAdminSessionToken: (input: { adminPassword: string; sessionToken: string | null | undefined }) => boolean;
  }>("./session.ts", "admin session");

  assert.equal(
    sessionModule.hasValidAdminSessionToken({
      adminPassword: "super-secret",
      sessionToken: "invalid-token",
    }),
    false,
  );
});
