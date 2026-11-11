import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("SectionHeading renders a token-based h2, optional description and link, without data access", () => {
  const source = readSource("src/components/SectionHeading.tsx");

  assert.match(source, /<h2 className="font-display text-heading font-semibold tracking-heading">\{title\}<\/h2>/);
  assert.match(source, /if \(!description && !link\) \{\s*return heading;\s*\}/s);
  assert.doesNotMatch(source, /from "@\/lib\//);
  assert.doesNotMatch(source, /\basync\b/);
});

test("home page uses SectionHeading for Projects, Writing & Notes and Contact", () => {
  const source = readSource("src/app/page.tsx");

  assert.match(source, /<SectionHeading\s+title="Projects"[^>]*link=\{\{ href: "\/projects", label: "All projects" \}\}/s);
  assert.match(source, /<SectionHeading\s+title="Writing & Notes"[^>]*link=\{\{ href: "\/blog", label: "All posts" \}\}/s);
  assert.match(source, /<SectionHeading title="Contact" \/>/);
  assert.doesNotMatch(source, /font-\[family-name/);
});
