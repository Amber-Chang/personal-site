import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Prose only handles styling: shared prose classes built from tokens, no data access", () => {
  const source = readSource("src/components/Prose.tsx");

  assert.match(source, /prose prose-neutral max-w-none text-body leading-8/);
  assert.match(source, /prose-headings:font-display prose-headings:tracking-heading/);
  assert.match(source, /prose-h2:text-prose-h2/);
  assert.match(source, /prose-p:text-foreground-soft/);
  assert.doesNotMatch(source, /font-\[family-name/);
  assert.doesNotMatch(source, /from "@\/lib\//);
  assert.doesNotMatch(source, /\basync\b/);
});

test("Prose keeps the article-only tighter heading line height out of the page variant", () => {
  const source = readSource("src/components/Prose.tsx");

  assert.match(source, /const articleClassName = "prose-h2:leading-tight md:leading-9";/);
  assert.match(source, /variant === "article" \? `\$\{baseClassName\} \$\{articleClassName\}` : baseClassName/);
});

test("article, project and about pages use Prose instead of their own prose class strings", () => {
  for (const page of ["src/app/blog/[slug]/page.tsx", "src/app/projects/[slug]/page.tsx", "src/app/about/page.tsx"]) {
    const source = readSource(page);

    assert.match(source, /import \{ Prose \} from "@\/components\/Prose";/);
    assert.doesNotMatch(source, /className="prose /);
  }

  assert.match(readSource("src/app/about/page.tsx"), /<Prose as="article" variant="page">/);
});
