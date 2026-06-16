import assert from "node:assert/strict";
import test from "node:test";

async function loadModule<TModule>(pathName: string, label: string): Promise<TModule> {
  const loadedModule = await import(pathName).catch(() => null);

  assert.ok(loadedModule, `expected ${label} module to exist at ${pathName}`);

  return loadedModule as TModule;
}

test("resolveAuthCallbackUrl falls back to configured site URL for non-local forwarded hosts", async () => {
  const callbackUrlModule = await loadModule<{
    resolveAuthCallbackUrl: (input: {
      fallbackSiteUrl: string;
      headers?: { get: (name: string) => string | null };
      requestUrl?: string;
    }) => string;
  }>("./callback-url.ts", "auth callback url");

  const url = callbackUrlModule.resolveAuthCallbackUrl({
    fallbackSiteUrl: "https://amberchang.com",
    headers: {
      get: (name) => {
        if (name === "x-forwarded-host") return "my-preview.vercel.app";
        if (name === "x-forwarded-proto") return "https";
        return null;
      },
    },
  });

  assert.equal(url, "https://amberchang.com/auth/callback");
});

test("resolveAuthCallbackUrl uses request origin for local development", async () => {
  const callbackUrlModule = await loadModule<{
    resolveAuthCallbackUrl: (input: {
      fallbackSiteUrl: string;
      headers?: { get: (name: string) => string | null };
      requestUrl?: string;
    }) => string;
  }>("./callback-url.ts", "auth callback url");

  const url = callbackUrlModule.resolveAuthCallbackUrl({
    fallbackSiteUrl: "https://amberchang.com",
    requestUrl: "http://localhost:3000/admin/login",
  });

  assert.equal(url, "http://localhost:3000/auth/callback");
});

test("resolveAuthCallbackUrl uses local forwarded headers when request URL is unavailable", async () => {
  const callbackUrlModule = await loadModule<{
    resolveAuthCallbackUrl: (input: {
      fallbackSiteUrl: string;
      headers?: { get: (name: string) => string | null };
      requestUrl?: string;
    }) => string;
  }>("./callback-url.ts", "auth callback url");

  const url = callbackUrlModule.resolveAuthCallbackUrl({
    fallbackSiteUrl: "https://amberchang.com",
    headers: {
      get: (name) => {
        if (name === "x-forwarded-host") return "127.0.0.1:3000";
        if (name === "x-forwarded-proto") return "http";
        return null;
      },
    },
  });

  assert.equal(url, "http://127.0.0.1:3000/auth/callback");
});

test("resolveAuthCallbackUrl falls back to configured site URL", async () => {
  const callbackUrlModule = await loadModule<{
    resolveAuthCallbackUrl: (input: {
      fallbackSiteUrl: string;
      headers?: { get: (name: string) => string | null };
      requestUrl?: string;
    }) => string;
  }>("./callback-url.ts", "auth callback url");

  const url = callbackUrlModule.resolveAuthCallbackUrl({
    fallbackSiteUrl: "https://amberchang.com",
  });

  assert.equal(url, "https://amberchang.com/auth/callback");
});
