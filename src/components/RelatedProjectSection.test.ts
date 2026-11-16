import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

// SPEC-004：文章內頁底部的「相關案例」：和延伸閱讀同一種樣式，顯示標題與「類型 · 角色」。
test("RelatedProjectSection links to the related project with its type and role, and renders nothing without one", () => {
  const source = fs.readFileSync(new URL("./RelatedProjectSection.tsx", import.meta.url), "utf8");

  assert.match(source, /if \(!relatedProject\) \{\s*return null;\s*\}/);
  assert.match(source, /<section aria-labelledby="related-project-heading" className="mt-14 border-t border-foreground pt-3\.5">/);
  assert.match(source, />\s*相關案例\s*</);
  assert.match(source, /href=\{`\/projects\/\$\{relatedProject\.slug\}`\}/);
  assert.match(source, /\{relatedProject\.title\}/);
  assert.match(source, /\[relatedProject\.typeLabel, relatedProject\.role\]\.filter\(Boolean\)\.join\(" · "\)/);
  assert.doesNotMatch(source, /Card|Badge|rounded/);
});
