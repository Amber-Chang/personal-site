// SPEC-004：首頁與文章列表是兩欄：左欄身分區、右欄分頁與清單。頁面只負責組裝，資料與排序在 data 模組。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const TWO_COLUMN = /className="grid gap-9 lg:grid-cols-\[18\.75rem_minmax\(0,1fr\)\] lg:gap-18"/;

test("home page is the cases tab: identity column with the H1, tabs, every case block and a link to the posts", () => {
  const source = readSource("src/app/page.tsx");

  assert.match(source, TWO_COLUMN);
  assert.match(source, /<IdentityColumn ledeAs="h1" \/>/);
  assert.match(source, /<ContentTabs active="cases" counts=\{counts\} \/>/);
  assert.match(source, /projects\.map\(\(project\) => \(\s*<CaseBlock key=\{project\.slug\} project=\{project\} \/>/);
  assert.match(source, />\s*目前還沒有公開的案例。\s*</);
  assert.match(source, /href="\/blog"[\s\S]*?>\s*也看看我寫的文章 →\s*</);
  assert.match(source, /loadHomePageData\(\{\s*service: getPublicBlogContentService\(\),?\s*\}\)/);
  // 頁面裡沒有自己的 H1，H1 是身分區的定位句。
  assert.doesNotMatch(source, /<h1\b/);
});

test("home metadata and pageview properties stay the same", () => {
  const source = readSource("src/app/page.tsx");
  const metadata = source.match(/export const metadata: Metadata = \{[\s\S]*?\n\};/)?.[0] ?? "";

  assert.match(metadata, /title: "Amber Chang — AI-native Product Builder"/);
  assert.match(metadata, /description: "我把模糊的需求整理成可以上線的產品，並用 AI 把想法更快做成成果。"/);
  assert.match(source, /contentType: "home",\s*sourceTemplate: "home",/);
});

test("blog page is the posts tab: screen-reader H1, identity column without the H1, tabs, every post row and a link back", () => {
  const source = readSource("src/app/blog/page.tsx");

  assert.match(source, TWO_COLUMN);
  assert.match(source, /<h1 className="sr-only">文章<\/h1>/);
  assert.match(source, /<IdentityColumn ledeAs="p" \/>/);
  assert.match(source, /<ContentTabs active="posts" counts=\{counts\} \/>/);
  assert.match(source, /posts\.map\(\(post\) => \(\s*<PostRow key=\{post\.slug\} post=\{post\} \/>/);
  assert.match(source, />\s*目前還沒有公開的文章。\s*</);
  assert.match(source, /href="\/"[\s\S]*?>\s*← 回到案例\s*</);
});

test("blog metadata and pageview properties stay the same", () => {
  const source = readSource("src/app/blog/page.tsx");

  assert.match(source, /title: "Writing & Notes — Amber Chang"/);
  assert.match(source, /description: "Amber 的文章列表：AI 協作、產品管理、學習紀錄。"/);
  assert.match(source, /contentType: "blog_index",\s*sourceTemplate: "blog_index",/);
});
