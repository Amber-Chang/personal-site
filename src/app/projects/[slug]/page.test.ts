import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("project page uses composed page data and renders related posts after the article body", () => {
  const source = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /loadProjectPageData/);
  assert.match(source, /service:\s*getPublicBlogContentService\(\)/);
  assert.match(source, /RelatedPostsSection/);
  assert.match(source, /<RelatedPostsSection relatedPosts={project\.relatedPosts} \/>/);
  assert.match(
    source,
    /<Prose>\s*<MarkdownContent content=\{project\.content\} \/>\s*<\/Prose>\s*<RelatedPostsSection relatedPosts={project\.relatedPosts} \/>/,
  );
});

test("project detail page shows the type label above the title only when there is one", () => {
  const source = fs.readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /\{project\.projectTypeLabel \? \(\s*<p className="text-label tracking-label text-muted-foreground">\{project\.projectTypeLabel\}<\/p>\s*\) : null\}\s*<h1/,
  );
});
