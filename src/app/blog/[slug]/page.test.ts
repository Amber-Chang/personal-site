import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// SPEC-004：文章內頁單欄（最寬 45rem）：返回「文章」、標題、完整日期、內文，相關案例放在內文後面。
test("blog post page is a single column with back link, title, full date, body and the related project last", () => {
  const source = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /<article className="mx-auto max-w-180">/);
  assert.match(source, /<BackLink href="\/blog" label="文章" \/>/);
  assert.match(source, /<h1 className="mt-3\.5 text-article-title font-semibold tracking-heading">\s*\{post\.title\}\s*<\/h1>/);
  assert.match(source, /<time dateTime=\{post\.date\}>\{formatFullDate\(post\.date\)\}<\/time>/);
  assert.match(source, /import \{ Prose \} from "@\/components\/Prose";/);
  assert.match(
    source,
    /<Prose>\s*<MarkdownContent content=\{post\.content\} \/>\s*<\/Prose>\s*<\/div>\s*<RelatedProjectSection relatedProject=\{post\.relatedProject\} \/>\s*<\/article>/,
  );
  assert.match(source, /contentType: "post",[\s\S]*?sourceTemplate: "blog_detail",/);
});
