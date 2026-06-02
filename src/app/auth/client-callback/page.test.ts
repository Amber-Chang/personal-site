import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("client auth callback handles implicit magic link tokens", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/app/auth/client-callback/page.tsx"), "utf8");

  assert.match(source, /"use client"/);
  assert.match(source, /URLSearchParams\(window\.location\.hash\.slice\(1\)\)/);
  assert.match(source, /access_token/);
  assert.match(source, /refresh_token/);
  assert.match(source, /setSession/);
  assert.match(source, /router\.replace\("\/admin\/posts"\)/);
});

test("client auth callback handles code-based magic links", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/app/auth/client-callback/page.tsx"), "utf8");

  assert.match(source, /URLSearchParams\(window\.location\.search\)/);
  assert.match(source, /code/);
  assert.match(source, /window\.location\.replace\(`\/auth\/callback\?code=/);
});
