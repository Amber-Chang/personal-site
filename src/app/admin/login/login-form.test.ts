import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("admin login form submits a Google OAuth action instead of a password field", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/app/admin/login/login-form.tsx"), "utf8");

  assert.match(source, /使用 Google 登入/);
  assert.doesNotMatch(source, /type="password"/);
  assert.doesNotMatch(source, /placeholder="請輸入 admin 密碼"/);
});
