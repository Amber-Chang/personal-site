import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

for (const component of ["PostCard", "ProjectCard"]) {
  test(`${component} takes a heading level prop that defaults to h3`, () => {
    const source = readSource(`src/components/${component}.tsx`);

    assert.match(source, /headingLevel\?: "h2" \| "h3"/);
    assert.match(source, /headingLevel = "h3"/);
    assert.match(source, /const Heading = headingLevel;/);
    assert.match(source, /<Heading className=/);
    assert.doesNotMatch(source, /<h3 /);
  });
}

test("blog and projects index pages render cards with h2 titles under the page h1", () => {
  assert.match(readSource("src/app/blog/page.tsx"), /<PostCard key=\{post\.slug\} post=\{post\} headingLevel="h2" \/>/);
  assert.match(readSource("src/app/projects/page.tsx"), /<ProjectCard key=\{project\.slug\} project=\{project\} headingLevel="h2" \/>/);
});

test("home page keeps card titles at the default h3 and marks Contact as an h2", () => {
  const source = readSource("src/app/page.tsx");

  assert.doesNotMatch(source, /headingLevel=/);
  // Contact 的標題改由 SectionHeading 輸出；SectionHeading 一律用 h2。
  assert.match(source, /<SectionHeading title="Contact" \/>/);
  assert.match(readSource("src/components/SectionHeading.tsx"), /<h2 className="[^"]*">\{title\}<\/h2>/);
  assert.doesNotMatch(source, /<p className="[^"]*">Contact<\/p>/);
});
