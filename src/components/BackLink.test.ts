import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("BackLink is a muted ← link with a 44px target and a focus ring", () => {
  const source = readSource("src/components/BackLink.tsx");

  assert.match(source, /export function BackLink/);
  assert.match(source, /\{`← \$\{label\}`\}/);
  assert.match(source, /focus-ring inline-flex min-h-11 items-center text-sm text-muted-foreground/);
  assert.doesNotMatch(source, /from "@\/lib\//);
});

test("detail pages, About and 404 use the single-column back links from SPEC-004", () => {
  assert.match(readSource("src/app/blog/[slug]/page.tsx"), /<BackLink href="\/blog" label="文章" \/>/);
  assert.match(readSource("src/app/projects/[slug]/page.tsx"), /<BackLink href="\/" label="案例" \/>/);
  assert.match(readSource("src/app/about/page.tsx"), /<BackLink href="\/" label="首頁" \/>/);
  assert.equal(fs.existsSync(path.join(process.cwd(), "src/components/PageHeader.tsx")), false);
});

test("About is a single column with the H1, the prose and a primary 寫信給我 button", () => {
  const source = readSource("src/app/about/page.tsx");

  assert.match(source, /<div className="mx-auto max-w-180">/);
  assert.match(source, /<h1 className="mt-3\.5 text-article-title font-semibold tracking-heading">關於我<\/h1>/);
  assert.match(source, /<Prose as="article" variant="page">/);
  assert.match(source, /className=\{primaryButtonClassName\} href="mailto:taco5239@gmail\.com"/);
  assert.match(source, /contentType: "about",\s*sourceTemplate: "about",/);
});

test("the 404 page is a single column with 案例 as the primary action and 文章 as the secondary one", () => {
  const source = readSource("src/app/not-found.tsx");

  assert.match(source, /<div className="mx-auto max-w-180">/);
  assert.match(source, /<h1 className="mt-2 text-article-title font-semibold tracking-heading">找不到這個頁面<\/h1>/);
  assert.match(source, /className=\{primaryButtonClassName\} href="\/"[\s\S]*?>\s*案例\s*</);
  assert.match(source, /className=\{secondaryButtonClassName\} href="\/blog"[\s\S]*?>\s*文章\s*</);
  assert.doesNotMatch(source, /rounded-full/);
});
