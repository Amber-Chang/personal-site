import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

// SPEC-005：頁首與根版面在伺服器渲染時不讀 cookie 或登入狀態，公開頁才能預先產生。
test("Header and the root layout no longer read cookies or the admin state on the server", () => {
  for (const file of ["src/components/Header.tsx", "src/app/layout.tsx"]) {
    const source = readSource(file);

    assert.doesNotMatch(source, /next\/headers|cookies\(|readServerAdminAuthState|getAdminAuthState/, file);
  }

  const header = readSource("src/components/Header.tsx");

  assert.doesNotMatch(header, /async function Header/);
  assert.match(header, /<HeaderAdminLinks \/>/);
});

test("the admin links are a client component that asks the server only when a session cookie exists", () => {
  const source = readSource("src/components/HeaderAdminLinks.tsx");

  assert.match(source, /^"use client";/);
  assert.match(source, /readIsAdminFromBrowser\(\{[\s\S]*?cookie: document\.cookie/);
  assert.doesNotMatch(source, /readServerAdminAuthState/);
  // 換頁時重新判斷：登出後 cookie 被清掉，入口跟著消失。
  assert.match(source, /usePathname\(\)/);
  assert.match(source, /\}, \[pathname\]\);/);
  assert.match(source, /if \(!isAdmin\) \{\s*return null;\s*\}/);
  assert.match(source, /href="\/admin\/posts"/);
  assert.match(source, /後台/);
  assert.match(source, /<form action=\{requestAdminLogout\}>/);
  assert.match(source, /登出/);
});
