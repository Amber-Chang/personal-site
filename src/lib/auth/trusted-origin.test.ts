import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

function createHeaders(entries: Record<string, string>) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(entries)) {
    headers.set(key, value);
  }

  return headers;
}

test("isTrustedAdminOrigin accepts the configured site origin", async () => {
  const trustedOriginModule = await loadModule<{
    isTrustedAdminOrigin: (input: { headers: Headers; siteUrl?: string }) => boolean;
  }>("./trusted-origin.ts", "trusted origin");

  const isTrusted = trustedOriginModule.isTrustedAdminOrigin({
    headers: createHeaders({
      origin: "https://personal-site-two-opal.vercel.app",
    }),
    siteUrl: "https://personal-site-two-opal.vercel.app",
  });

  assert.equal(isTrusted, true);
});

test("isTrustedAdminOrigin accepts the forwarded host origin", async () => {
  const trustedOriginModule = await loadModule<{
    isTrustedAdminOrigin: (input: { headers: Headers; siteUrl?: string }) => boolean;
  }>("./trusted-origin.ts", "trusted origin");

  const isTrusted = trustedOriginModule.isTrustedAdminOrigin({
    headers: createHeaders({
      origin: "http://localhost:3000",
      "x-forwarded-host": "localhost:3000",
      "x-forwarded-proto": "http",
    }),
    siteUrl: "https://personal-site-two-opal.vercel.app",
  });

  assert.equal(isTrusted, true);
});

test("requireTrustedAdminOrigin rejects untrusted origins", async () => {
  const trustedOriginModule = await loadModule<{
    UntrustedOriginError: new () => Error;
    requireTrustedAdminOrigin: (input?: { headers?: Headers; siteUrl?: string }) => Promise<void>;
  }>("./trusted-origin.ts", "trusted origin");

  await assert.rejects(
    () =>
      trustedOriginModule.requireTrustedAdminOrigin({
        headers: createHeaders({
          origin: "https://evil.example.com",
        }),
        siteUrl: "https://personal-site-two-opal.vercel.app",
      }),
    (error: unknown) => error instanceof trustedOriginModule.UntrustedOriginError,
  );
});
