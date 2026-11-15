import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readGlobalsCss() {
  return fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
}

function relativeLuminance(hex: string) {
  const [red, green, blue] = [1, 3, 5].map((index) => {
    const channel = parseInt(hex.slice(index, index + 2), 16) / 255;

    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: string, second: string) {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);

  return (lighter + 0.05) / (darker + 0.05);
}

// 程式碼區塊底色 = bg-muted/25 疊在頁面底色上。頁面左上角有 accent 光暈，那裡的底色最深、對比最低，
// 以那一點換算成的 sRGB 值當最壞情況（換算方式見 docs/design-tokens.md 的「程式碼上色」）。
const DARKEST_CODE_BLOCK_BACKGROUND = "#f4f6f6";

const CODE_COLOR_TOKENS = ["--code-keyword", "--code-title", "--code-constant", "--code-string", "--code-builtin", "--code-comment", "--code-tag"];

test("every code highlight colour reaches 4.5:1 against the darkest code block background", () => {
  const css = readGlobalsCss();

  for (const token of CODE_COLOR_TOKENS) {
    const value = css.match(new RegExp(`${token}: (#[0-9a-f]{6});`))?.[1];

    assert.ok(value, `expected ${token} to be defined as a hex colour in globals.css`);
    assert.ok(contrastRatio(value, DARKEST_CODE_BLOCK_BACKGROUND) >= 4.5, `${token} ${value} is below 4.5:1`);
  }
});

test("highlight.js classes are coloured only through the code tokens", () => {
  const css = readGlobalsCss();

  for (const selector of [".hljs-keyword", ".hljs-title", ".hljs-number", ".hljs-string", ".hljs-built_in", ".hljs-comment", ".hljs-name"]) {
    assert.ok(css.includes(selector), `expected ${selector} to be styled`);
  }

  const sectionStart = css.indexOf("/* 程式碼上色");

  assert.ok(sectionStart >= 0, "expected the code highlight section in globals.css");

  // 這一段（到檔案結尾）除了 --code-* 色票本身與註解，不再出現寫死的色碼。
  const highlightBlock = css.slice(sectionStart).replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(highlightBlock.replace(/--code-[a-z]+: #[0-9a-f]{6};/g, ""), /#[0-9a-f]{3,6}\b/i);
});

test("code inside a code block does not inherit the inline code background, padding or font size", () => {
  const css = readGlobalsCss();

  assert.match(css, /\.prose pre code \{\s*background-color: transparent;\s*border-radius: 0;\s*font-size: inherit;\s*padding: 0;\s*\}/);
});
