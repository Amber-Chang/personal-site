import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("legacy client auth callback redirects back to a controlled admin login error", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/app/auth/client-callback/page.tsx"), "utf8");

  assert.doesNotMatch(source, /"use client"/);
  assert.match(source, /redirect\("\/admin\/login\?error=invalid_auth_callback"\)/);
});
