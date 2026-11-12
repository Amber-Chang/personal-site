import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

// PM 決策 D2：標題載入 Noto Serif TC（只載 600），內文用系統字體。
test("root layout loads only the 600 weight of Noto Serif TC and exposes it as a CSS variable", () => {
  const source = readSource("src/app/layout.tsx");

  assert.match(source, /import \{ Noto_Serif_TC \} from "next\/font\/google";/);
  assert.match(source, /weight: "600",/);
  assert.doesNotMatch(source, /weight: \[/);
  assert.match(source, /variable: "--font-noto-serif-tc",/);
  assert.match(source, /<html lang="zh-Hant" className=\{notoSerifTC\.variable\}>/);
});

test("display font token uses the loaded font and body text uses system fonts only", () => {
  const css = readSource("src/app/globals.css");

  assert.match(css, /--font-display: var\(--font-noto-serif-tc\), serif;/);
  assert.match(css, /--font-sans: "PingFang TC", "Microsoft JhengHei"/);
  assert.doesNotMatch(css, /Noto Sans TC/);
});
