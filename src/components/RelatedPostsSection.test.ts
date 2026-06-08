import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("RelatedPostsSection omits empty state and renders related posts as contextual reading", () => {
  const source = fs.readFileSync(new URL("./RelatedPostsSection.tsx", import.meta.url), "utf8");

  assert.match(source, /if \(relatedPosts\.length === 0\) \{\s*return null;\s*\}/s);
  assert.match(source, /延伸閱讀/);
  assert.match(source, /relatedPosts\.map/);
  assert.match(source, /post\.description/);
  assert.match(source, /href=\{`\/blog\/\$\{post\.slug\}`\}/);
});
