// SPEC-005：公開頁預先產生，每小時自動更新一次；新上架的內頁在第一次瀏覽時產生（dynamicParams 維持預設 true）。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const PUBLIC_DATA_PAGES = ["src/app/page.tsx", "src/app/blog/page.tsx", "src/app/blog/[slug]/page.tsx", "src/app/projects/[slug]/page.tsx"];

test("public pages are pre-generated and refreshed hourly instead of rendered on every request", () => {
  for (const file of PUBLIC_DATA_PAGES) {
    const source = readSource(file);

    assert.doesNotMatch(source, /export const revalidate = 0;/, file);
    assert.match(source, /export const revalidate = 3600;/, file);
    assert.doesNotMatch(source, /export const dynamic = /, file);
    assert.doesNotMatch(source, /export const dynamicParams = false/, file);
    assert.doesNotMatch(source, /next\/headers|cookies\(|headers\(\)/, file);
  }
});

test("post and project detail pages pre-generate every published slug at build time", () => {
  const postPage = readSource("src/app/blog/[slug]/page.tsx");
  const projectPage = readSource("src/app/projects/[slug]/page.tsx");

  assert.match(postPage, /export async function generateStaticParams\(\) \{[\s\S]*?listPublicPosts\(\)[\s\S]*?slug: post\.slug/);
  assert.match(projectPage, /export async function generateStaticParams\(\) \{[\s\S]*?listPublicProjects\(\)[\s\S]*?slug: project\.slug/);

  // 不存在或未上架的網址回 404。
  assert.match(postPage, /notFound\(\)/);
  assert.match(projectPage, /notFound\(\)/);
});
