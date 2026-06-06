import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("admin login action uses cookie session auth instead of Supabase auth calls", () => {
  const loginActionSource = fs.readFileSync(path.join(process.cwd(), "src/app/admin/login/actions.ts"), "utf8");

  assert.match(loginActionSource, /setAdminSession/);
  assert.match(loginActionSource, /createAdminServerSession/);
  assert.doesNotMatch(loginActionSource, /signInWithOtp/);
});
