import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("admin login action starts Google OAuth through Supabase instead of minting a password session", () => {
  const loginActionSource = fs.readFileSync(path.join(process.cwd(), "src/app/admin/login/actions.ts"), "utf8");
  const callbackRouteSource = fs.readFileSync(path.join(process.cwd(), "src/app/auth/callback/route.ts"), "utf8");
  const adminContextSource = fs.readFileSync(path.join(process.cwd(), "src/app/admin/posts/admin-context.ts"), "utf8");

  assert.match(loginActionSource, /createRequestAdminLoginAction/);
  assert.match(loginActionSource, /createServerSupabaseClient/);
  assert.match(loginActionSource, /requireTrustedAdminOrigin/);
  assert.doesNotMatch(loginActionSource, /setAdminSession/);
  assert.doesNotMatch(loginActionSource, /createAdminServerSession/);
  assert.doesNotMatch(callbackRouteSource, /createAdminServerSession/);
  assert.match(adminContextSource, /readServerAdminAuthState/);
  assert.doesNotMatch(adminContextSource, /hasActiveAdminSession/);
});
