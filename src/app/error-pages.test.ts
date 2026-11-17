// SPEC-005：一般錯誤頁（app/error.tsx）與最後防線錯誤頁（app/global-error.tsx）。文案經 PM 確認，用原文檢查。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const CONTENT = "src/components/ErrorPageContent.tsx";
const ERROR_PAGE = "src/app/error.tsx";
const GLOBAL_ERROR_PAGE = "src/app/global-error.tsx";

test("the error content uses the approved copy with one H1 and no technical details", () => {
  const source = readSource(CONTENT);

  assert.match(source, /^"use client";/);
  assert.equal(source.match(/<h1\b/g)?.length, 1);
  assert.match(source, /<h1[^>]*>這個頁面暫時無法顯示<\/h1>/);
  assert.match(source, /可能是網站正在維護，請稍後再試。如果急著找我，可以直接寫信到\{" "\}\s*<a\b/);
  assert.match(source, /<\/a>\s*。\s*<\/p>/);
  assert.match(source, />\s*重新整理\s*</);
  assert.match(source, />\s*回首頁\s*</);
  // 不顯示錯誤訊息、digest 或堆疊。
  assert.doesNotMatch(source, /error\.(message|digest|stack)|\{error\}|digest|\.stack/);
});

test("the email is selectable text with a mailto link", () => {
  const source = readSource(CONTENT);

  assert.match(source, /const CONTACT_EMAIL = "taco5239@gmail\.com";/);
  assert.match(source, /<a\s[^>]*href=\{`mailto:\$\{CONTACT_EMAIL\}`\}[^>]*>\s*\{CONTACT_EMAIL\}\s*<\/a>/);
  assert.match(source, /select-all/);
});

test("the buttons are real controls: retry is a button, home is a link to /", () => {
  const source = readSource(CONTENT);

  assert.match(source, /<button className=\{primaryButtonClassName\} onClick=\{onRetry\} type="button">/);
  assert.match(source, /<Link className=\{secondaryButtonClassName\} href="\/">/);
});

test("error content only uses design tokens", () => {
  for (const file of [CONTENT, ERROR_PAGE, GLOBAL_ERROR_PAGE]) {
    const source = readSource(file);

    assert.doesNotMatch(source, /text-\[|rounded-\[|tracking-\[|leading-\[|#[0-9a-fA-F]{3,6}\b|style=\{/, file);
  }
});

test("error.tsx retries through the framework: refresh the server data, then reset the boundary", () => {
  const source = readSource(ERROR_PAGE);

  assert.match(source, /^"use client";/);
  assert.match(source, /reset: \(\) => void/);
  assert.match(source, /startTransition\(\(\) => \{\s*router\.refresh\(\);\s*reset\(\);\s*\}\)/);
  assert.match(source, /<ErrorPageContent onRetry=\{retry\} \/>/);
  assert.doesNotMatch(source, /<html|<body/);
});

test("global-error.tsx ships its own html, body and styles without the root layout", () => {
  const source = readSource(GLOBAL_ERROR_PAGE);

  assert.match(source, /^"use client";/);
  assert.match(source, /import "\.\/globals\.css";/);
  assert.match(source, /<html lang="zh-Hant">/);
  // 和根版面相同的 body 與內容外框，背景、字色、字體由 globals.css 的 body 樣式提供。
  assert.match(source, /<body className="flex min-h-screen flex-col antialiased">/);
  assert.match(source, /<main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 md:px-6 md:py-14">/);
  assert.match(source, /<title>這個頁面暫時無法顯示 — Amber Chang<\/title>/);
  assert.match(source, /startTransition\(\(\) => \{\s*router\.refresh\(\);\s*reset\(\);\s*\}\)/);
  assert.match(source, /<ErrorPageContent onRetry=\{retry\} \/>/);
  assert.doesNotMatch(source, /from "@\/components\/(Header|Footer)"/);
});
