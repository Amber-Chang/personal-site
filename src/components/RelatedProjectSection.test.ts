import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("RelatedProjectSection omits empty state and links to the related project with contextual copy", () => {
  const source = fs.readFileSync(new URL("./RelatedProjectSection.tsx", import.meta.url), "utf8");

  assert.match(source, /if \(!relatedProject\) \{\s*return null;\s*\}/s);
  assert.match(source, /相關案例/);
  assert.match(source, /relatedProject\.title/);
  assert.match(source, /relatedProject\.summary/);
  assert.match(source, /href=\{`\/projects\/\$\{relatedProject\.slug\}`\}/);
});
