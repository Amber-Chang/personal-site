import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { createAdminSessionStatusHandler } from "./status-core.ts";

type AuthState = { isAdmin: boolean; isAuthenticated: boolean; normalizedEmail: string | null };

function createHandler(getAdminAuthState: () => Promise<AuthState>) {
  const logged: unknown[] = [];
  const handler = createAdminSessionStatusHandler({
    getAdminAuthState,
    logError: (message, error) => {
      logged.push([message, error]);
    },
  });

  return { handler, logged };
}

test("an allowed admin gets { isAdmin: true } and nothing else", async () => {
  const { handler } = createHandler(async () => ({
    isAdmin: true,
    isAuthenticated: true,
    normalizedEmail: "owner@example.com",
  }));
  const response = await handler();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { isAdmin: true });
});

test("a signed-in user outside the allowlist gets { isAdmin: false } without the email", async () => {
  const { handler } = createHandler(async () => ({
    isAdmin: false,
    isAuthenticated: true,
    normalizedEmail: "someone@example.com",
  }));
  const response = await handler();
  const text = await response.text();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(JSON.parse(text), { isAdmin: false });
  assert.doesNotMatch(text, /@/);
});

test("a visitor without a session gets { isAdmin: false }", async () => {
  const { handler } = createHandler(async () => ({ isAdmin: false, isAuthenticated: false, normalizedEmail: null }));
  const response = await handler();

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { isAdmin: false });
});

test("a failing auth check answers { isAdmin: false } with 500, no-store, and logs the error", async () => {
  const failure = new Error("supabase unreachable");
  const { handler, logged } = createHandler(async () => {
    throw failure;
  });
  const response = await handler();
  const text = await response.text();

  assert.equal(response.status, 500);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(JSON.parse(text), { isAdmin: false });
  assert.doesNotMatch(text, /supabase unreachable/);
  assert.equal(logged.length, 1);
});

test("the route only exports GET, stays dynamic and reuses the server-side allowlist check", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/app/api/admin/session/route.ts"), "utf8");

  assert.match(source, /export const GET = createAdminSessionStatusHandler\(/);
  assert.doesNotMatch(source, /export (const|async function) (POST|PUT|PATCH|DELETE|OPTIONS)\b/);
  assert.match(source, /export const dynamic = "force-dynamic";/);
  assert.match(source, /readServerAdminAuthState\(\)/);
});
