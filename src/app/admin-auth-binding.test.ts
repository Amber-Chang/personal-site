import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("server auth integrations preserve Supabase auth method context", () => {
  const loginActionSource = fs.readFileSync(path.join(process.cwd(), "src/app/admin/login/actions.ts"), "utf8");
  const authCallbackSource = fs.readFileSync(path.join(process.cwd(), "src/app/auth/callback/route.ts"), "utf8");

  assert.doesNotMatch(loginActionSource, /signInWithOtp:\s*supabase\.auth\.signInWithOtp/);
  assert.doesNotMatch(authCallbackSource, /exchangeCodeForSession:\s*supabase\.auth\.exchangeCodeForSession/);
  assert.doesNotMatch(authCallbackSource, /signOut:\s*supabase\.auth\.signOut/);
});
