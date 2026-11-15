import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("MermaidDiagram is a client component that loads mermaid only when it mounts", () => {
  const source = readSource("src/components/MermaidDiagram.tsx");

  assert.match(source, /^"use client";/);
  // 只在元件掛上頁面後才動態載入；沒有 mermaid 區塊的頁面不會下載 Mermaid 程式。
  assert.match(source, /import\("mermaid"\)/);
  assert.doesNotMatch(source, /from "mermaid"/);
  assert.match(source, /useEffect\(/);
  assert.match(source, /renderMermaidDiagram\(/);
});

test("MermaidDiagram shows the source before loading and on errors, with the agreed message", () => {
  const source = readSource("src/components/MermaidDiagram.tsx");

  // 載入前、沒有 JavaScript、語法錯誤時都看得到原始碼。
  assert.match(source, /<pre>\s*<code className="language-mermaid">\{source\}<\/code>\s*<\/pre>/);
  assert.match(source, /\{MERMAID_ERROR_MESSAGE\}/);
  assert.match(source, /state\.status === "error"/);
});

test("a rendered diagram sits in its own scroll container outside the prose styles", () => {
  const source = readSource("src/components/MermaidDiagram.tsx");

  assert.match(source, /className="mermaid-diagram not-prose my-8 overflow-x-auto"/);
  // 圖表保留可讀的最小寬度：由 globals.css 的 .mermaid-diagram > svg 讀這個變數。
  assert.match(source, /"--mermaid-svg-min-width": `\$\{state\.minWidth\}px`/);
  // React 19 只要 dangerouslySetInnerHTML 的物件換了就會重設 innerHTML；物件要跟著結果記住，
  // 否則後台即時預覽每次更新都會把沒變的圖表重新放一次。
  assert.match(source, /const svgMarkup = useMemo\(\(\) => \(state\.status === "ready" \? \{ __html: state\.svg \} : null\), \[state\]\);/);
  assert.match(source, /dangerouslySetInnerHTML=\{svgMarkup\}/);
});

test("MarkdownContent hands mermaid blocks to MermaidDiagram", () => {
  const source = readSource("src/components/MarkdownContent.tsx");

  assert.match(source, /import \{ MermaidDiagram \} from "\.\/MermaidDiagram\.tsx";/);
  assert.match(source, /createMarkdownComponents\(\{ CodeCopyButton, MermaidDiagram \}\)/);
});

test("globals.css lets the svg shrink to the column but not below the minimum the component sets", () => {
  const css = readSource("src/app/globals.css");

  assert.match(css, /\.mermaid-diagram > svg \{\s*min-width: var\(--mermaid-svg-min-width, 0px\);\s*\}/);
});
