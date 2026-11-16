import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

// SPEC-004：標題改用和內文相同的系統字體，layout 不再載入 Noto Serif TC（社群分享圖用自己內建的字體，不受影響）。
test("root layout no longer loads Noto Serif TC or any next/font", () => {
  const source = readSource("src/app/layout.tsx");

  assert.doesNotMatch(source, /next\/font/);
  assert.doesNotMatch(source, /Noto_Serif_TC|notoSerifTC|--font-noto-serif-tc/);
  assert.match(source, /<html lang="zh-Hant">/);
});

test("headings and body text both use the system font stack; no display font token remains", () => {
  const css = readSource("src/app/globals.css");

  assert.match(css, /--font-sans: "PingFang TC", "Microsoft JhengHei"/);
  assert.doesNotMatch(css, /--font-display|--font-noto-serif-tc|Noto Sans TC/);
});

test("the social share image keeps its own bundled font files", () => {
  const source = readSource("src/app/opengraph-image.tsx");

  assert.match(source, /noto-serif-latin-600-normal\.woff/);
});
