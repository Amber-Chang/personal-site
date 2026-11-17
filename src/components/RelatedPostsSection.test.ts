import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// SPEC-004：案例內頁底部的「延伸閱讀」：上方一條深色線，每篇是標題加完整日期，細線分隔。
test("RelatedPostsSection lists related posts with full dates and renders nothing when empty", () => {
  const source = fs.readFileSync(new URL("./RelatedPostsSection.tsx", import.meta.url), "utf8");

  assert.match(source, /if \(relatedPosts\.length === 0\) \{\s*return null;\s*\}/);
  assert.match(source, /<section aria-labelledby="related-posts-heading" className="mt-14 border-t border-foreground pt-3\.5">/);
  assert.match(source, /<h2 className="text-base font-semibold" id="related-posts-heading">\s*延伸閱讀\s*<\/h2>/);
  assert.match(source, /href=\{`\/blog\/\$\{post\.slug\}`\}/);
  assert.match(source, /<time dateTime=\{post\.date\}>\{formatFullDate\(post\.date\)\}<\/time>/);
  assert.match(source, /focus-ring/);
  assert.doesNotMatch(source, /rounded|formatYearMonth/);
});
