import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import matter from "gray-matter";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown, { type Components, type Options } from "react-markdown";

type MarkdownOptionsModule = {
  createMarkdownComponents: () => Components;
  rehypePlugins: Options["rehypePlugins"];
  remarkPlugins: Options["remarkPlugins"];
};

async function loadMarkdownOptions(): Promise<MarkdownOptionsModule> {
  const loadedModule = await import("./markdown-options.ts").catch(() => null);

  assert.ok(loadedModule, "expected markdown options module to exist at ./markdown-options.ts");

  return loadedModule as MarkdownOptionsModule;
}

// 用和 MarkdownContent 相同的設定把 Markdown 轉成 HTML 字串。
async function renderMarkdown(content: string) {
  const { createMarkdownComponents, rehypePlugins, remarkPlugins } = await loadMarkdownOptions();

  return renderToStaticMarkup(
    createElement(Markdown, { components: createMarkdownComponents(), rehypePlugins, remarkPlugins }, content),
  );
}

// 3B 之前的輸出方式：沒有任何外掛。
function renderLegacyMarkdown(content: string) {
  return renderToStaticMarkup(createElement(Markdown, null, content));
}

test("GFM tables render as a table with a header row inside a horizontally scrollable wrapper", async () => {
  const html = await renderMarkdown(["| 項目 | 數字 |", "| --- | --- |", "| 文章 | 4 |"].join("\n"));

  assert.match(html, /<div class="overflow-x-auto"><table>/);
  assert.match(html, /<thead><tr><th>項目<\/th><th>數字<\/th><\/tr><\/thead>/);
  assert.match(html, /<tbody><tr><td>文章<\/td><td>4<\/td><\/tr><\/tbody><\/table><\/div>/);
});

test("double-tilde strikethrough and task lists are supported; a single tilde stays plain text", async () => {
  const html = await renderMarkdown(["~~舊做法~~", "", "需要 3~5 天，或 7~10 天。", "", "- [x] 已完成", "- [ ] 未完成"].join("\n"));

  assert.match(html, /<del>舊做法<\/del>/);
  // 中文常用「~」表示範圍，單一波浪號不能變成刪除線。
  assert.match(html, /<p>需要 3~5 天，或 7~10 天。<\/p>/);
  assert.match(html, /<li class="task-list-item"><input type="checkbox" disabled="" checked=""\/> 已完成<\/li>/);
  assert.match(html, /<li class="task-list-item"><input type="checkbox" disabled=""\/> 未完成<\/li>/);
});

test("fenced code with a known language is highlighted on the server with hljs classes", async () => {
  const html = await renderMarkdown(["```ts", "const total: number = 1;", "```"].join("\n"));

  assert.match(html, /<pre><code class="hljs language-ts">/);
  assert.match(html, /<span class="hljs-keyword">const<\/span>/);
  assert.match(html, /<span class="hljs-built_in">number<\/span>/);
});

test("fenced code without a language or with an unknown language renders as plain code without throwing", async () => {
  const plain = await renderMarkdown(["```", "npm test", "```"].join("\n"));
  const unknown = await renderMarkdown(["```not-a-language", "a <- b", "```"].join("\n"));

  assert.equal(plain, "<pre><code>npm test\n</code></pre>");
  assert.match(unknown, /<pre><code class="hljs language-not-a-language">a &lt;- b\n<\/code><\/pre>/);
  assert.doesNotMatch(unknown, /<span/);
});

test("raw HTML in Markdown is shown as text and never rendered as tags", async () => {
  const html = await renderMarkdown(
    ['<script>alert("x")</script>', "", '<img src="x" onerror="alert(1)">', "", "段落 <b>粗體</b>"].join("\n"),
  );

  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /<b>/);
  assert.doesNotMatch(html, /<img src="x"/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /段落 &lt;b&gt;粗體&lt;\/b&gt;/);
});

test("images render lazily with async decoding and keep their alt text", async () => {
  const html = await renderMarkdown("![流程圖](https://example.com/flow.png)");
  const image = html.match(/<img [^>]*\/>/)?.[0] ?? "";

  assert.match(image, / src="https:\/\/example\.com\/flow\.png"/);
  assert.match(image, / alt="流程圖"/);
  assert.match(image, / loading="lazy"/);
  assert.match(image, / decoding="async"/);
});

test("markdown in the repo renders exactly as before the new plugins were added", async () => {
  const files = ["content/posts", "content/projects"].flatMap((directory) =>
    fs
      .readdirSync(path.join(process.cwd(), directory))
      .filter((file) => file.endsWith(".md"))
      .map((file) => path.join(process.cwd(), directory, file)),
  );

  assert.ok(files.length > 0, "expected markdown fixtures under content/");

  for (const file of files) {
    const { content } = matter(fs.readFileSync(file, "utf8"));

    assert.equal(await renderMarkdown(content), renderLegacyMarkdown(content), `output changed for ${file}`);
  }
});
