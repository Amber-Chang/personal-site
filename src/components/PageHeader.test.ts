import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("PageHeader renders back link, token-based h1 and optional description, without data access", () => {
  const source = readSource("src/components/PageHeader.tsx");

  assert.match(source, /export function BackLink/);
  assert.match(source, /\{`← \$\{label\}`\}/);
  assert.match(source, /<h1 className="font-display text-title font-semibold tracking-heading">\{title\}<\/h1>/);
  assert.match(source, /\{description \? <p className="text-sm text-muted-foreground">\{description\}<\/p> : null\}/);
  assert.doesNotMatch(source, /from "@\/lib\//);
  assert.doesNotMatch(source, /\basync\b/);
});

test("index pages use PageHeader and detail pages use BackLink", () => {
  assert.match(readSource("src/app/about/page.tsx"), /<PageHeader backHref="\/" backLabel="返回首頁" title="關於我" \/>/);
  assert.match(readSource("src/app/blog/page.tsx"), /<PageHeader backHref="\/" backLabel="返回首頁" title="Writing & Notes"/);
  assert.match(readSource("src/app/projects/page.tsx"), /<PageHeader\s+backHref="\/"\s+backLabel="返回首頁"\s+title="Projects"/);
  assert.match(readSource("src/app/blog/[slug]/page.tsx"), /<BackLink href="\/blog" label="返回文章列表" \/>/);
  assert.match(readSource("src/app/projects/[slug]/page.tsx"), /<BackLink href="\/projects" label="返回專案列表" \/>/);
});
