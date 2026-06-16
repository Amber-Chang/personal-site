import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("/admin/login page renders Google OAuth as the primary admin entry", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/app/admin/login/page.tsx"), "utf8");

  assert.match(source, /使用 Google 登入後台/);
  assert.doesNotMatch(source, /使用密碼登入後台/);
  assert.match(source, /getAdminLoginErrorMessage/);
  assert.match(source, /readServerAdminAuthState/);
});

test("/admin/login page reads controlled error state from search params", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/app/admin/login/page.tsx"), "utf8");

  assert.match(source, /searchParams/);
  assert.match(source, /errorMessage/);
});
