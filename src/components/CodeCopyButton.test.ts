import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const SOURCE = "src/components/CodeCopyButton.tsx";

test("CodeCopyButton is one small client component that copies the code next to it", () => {
  const source = readSource(SOURCE);

  assert.match(source, /^"use client";/);
  assert.match(source, /<button[\s\S]*?type="button"/);
  // 從同一個程式碼區塊的 <pre><code> 讀原始碼，不把程式碼再傳一份給瀏覽器。
  assert.match(source, /closest\("\[data-code-block\]"\)/);
  assert.match(source, /querySelector\("pre code"\)/);
  assert.match(source, /copyCodeText\(getCodeCopyText\(/);
  assert.match(source, /navigator\.clipboard/);
  assert.match(source, /CODE_COPY_FEEDBACK_MS/);
});

test("CodeCopyButton announces the result, has a 44px hit area, a visible focus ring and token colours", () => {
  const source = readSource(SOURCE);

  assert.match(source, /aria-live="polite"/);
  assert.match(source, /className="sr-only"/);
  assert.match(source, /min-h-11 min-w-11/);
  // 焦點框畫在看得見的膠囊上，不畫在 44px 的可點範圍外圈，避免蓋到下面的程式碼區塊。
  assert.match(source, /group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-foreground/);
  assert.match(source, /text-muted-foreground/);
  assert.doesNotMatch(source, /text-\[|rounded-\[|tracking-\[|#[0-9a-f]{3,6}\b/i);
});

test("MarkdownContent passes CodeCopyButton to the shared component overrides", () => {
  const source = readSource("src/components/MarkdownContent.tsx");

  assert.match(source, /import \{ CodeCopyButton \} from "\.\/CodeCopyButton\.tsx";/);
  assert.match(source, /createMarkdownComponents\(\{ CodeCopyButton, MermaidDiagram \}\)/);
});

test("code block header spacing lives in globals.css next to the code highlight rules", () => {
  const css = readSource("src/app/globals.css");

  assert.match(css, /\.prose \.code-block \{/);
  assert.match(css, /\.prose \.code-block > pre \{/);
});
