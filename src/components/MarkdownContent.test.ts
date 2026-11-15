import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("MarkdownContent renders Markdown with the shared plugins and component overrides", () => {
  const source = readSource("src/components/MarkdownContent.tsx");

  assert.match(source, /import ReactMarkdown from "react-markdown";/);
  assert.match(source, /from "\.\.\/lib\/markdown\/markdown-options\.ts";/);
  assert.match(source, /remarkPlugins=\{remarkPlugins\}/);
  assert.match(source, /rehypePlugins=\{rehypePlugins\}/);
  assert.match(source, /components=\{components\}/);
  assert.match(source, /\{content\}/);
});

test("MarkdownContent keeps raw HTML unrendered and stays usable from server and client components", () => {
  const source = readSource("src/components/MarkdownContent.tsx");

  // 不加 rehype-raw、不關掉 react-markdown 預設的 HTML 處理：Markdown 裡的 HTML 只會顯示成文字。
  assert.doesNotMatch(source, /rehype-raw/);
  assert.doesNotMatch(source, /rehypeRaw/);
  assert.doesNotMatch(source, /skipHtml/);
  // 前台由伺服器端輸出；後台預覽要能在 client component 內使用同一個元件。
  assert.doesNotMatch(source, /^"use client";/m);
  assert.doesNotMatch(source, /\basync\b/);
  // 排版樣式仍由 Prose 負責，MarkdownContent 不自己帶 prose class。
  assert.doesNotMatch(source, /className="prose/);
});

test("blog and project detail pages render their body with MarkdownContent inside Prose", () => {
  for (const [page, field] of [
    ["src/app/blog/[slug]/page.tsx", "post.content"],
    ["src/app/projects/[slug]/page.tsx", "project.content"],
  ] as const) {
    const source = readSource(page);

    assert.match(source, /import \{ MarkdownContent \} from "@\/components\/MarkdownContent";/);
    assert.doesNotMatch(source, /react-markdown/);
    assert.match(source, new RegExp(`<Prose>\\s*<MarkdownContent content=\\{${field.replace(".", "\\.")}\\} />\\s*</Prose>`));
  }
});
