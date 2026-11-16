import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function readPage() {
  return fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
}

test("project page uses composed page data and renders related posts after the article body", () => {
  const source = readPage();

  assert.match(source, /loadProjectPageData/);
  assert.match(source, /service:\s*getPublicBlogContentService\(\)/);
  assert.match(
    source,
    /<Prose>\s*<MarkdownContent content=\{project\.content\} \/>\s*<\/Prose>\s*<\/div>\s*<RelatedPostsSection relatedPosts=\{project\.relatedPosts\} \/>/,
  );
  assert.match(source, /contentType: "project",[\s\S]*?sourceTemplate: "project_detail",/);
});

// SPEC-004：案例內頁單欄：返回「案例」、赤陶類型標籤、標題、摘要、角色與期間的資訊框、左側赤陶線的成果清單。
test("project page is a single column with the terracotta type label above the title", () => {
  const source = readPage();

  assert.match(source, /<article className="mx-auto max-w-180">/);
  assert.match(source, /<BackLink href="\/" label="案例" \/>/);
  assert.match(
    source,
    /\{project\.projectTypeLabel \? \(\s*<p className="mt-3\.5 text-label font-semibold tracking-label text-terracotta">\{project\.projectTypeLabel\}<\/p>\s*\) : null\}\s*<h1/,
  );
  assert.match(source, /<h1 className="mt-2 text-article-title font-semibold tracking-heading">\s*\{project\.title\}\s*<\/h1>/);
});

test("role and period sit in an outlined info box; the period stays as typed in the admin", () => {
  const source = readPage();

  assert.match(source, /<dl className="mt-7 grid rounded-block border border-border bg-card md:grid-cols-2">/);
  assert.match(source, /<dt className="text-label text-muted-foreground">角色<\/dt>/);
  assert.match(source, /<dt className="text-label text-muted-foreground">期間<\/dt>/);
  assert.match(source, /\{project\.period \|\| "未提供"\}/);
});

test("outcomes are a list with a terracotta line on the left", () => {
  const source = readPage();

  assert.match(source, /project\.outcomes\.length > 0 \? \(\s*<ul aria-label="關鍵成果" className="[^"]*border-l-2 border-terracotta[^"]*">/);
  assert.match(source, /project\.outcomes\.map\(\(outcome\) => \(\s*<li key=\{outcome\}>\{outcome\}<\/li>/);
  assert.doesNotMatch(source, /Badge|rounded-full/);
});
