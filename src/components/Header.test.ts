import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("Header shows an admin link when an admin session is present", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/Header.tsx"), "utf8");

  assert.match(source, /ADMIN_SESSION_COOKIE_NAME/);
  assert.match(source, /hasValidAdminSessionToken/);
  assert.match(source, /href="\/admin\/posts"/);
  assert.match(source, /後台/);
});
