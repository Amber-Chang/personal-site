import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("AdminPostForm exposes publish and unpublish buttons instead of a status dropdown", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/admin/post-form.tsx"), "utf8");

  assert.doesNotMatch(source, /<select[\s\S]*name="status"/);
  assert.match(source, /name="intent"/);
  assert.match(source, /value="publish"/);
  assert.match(source, /value="draft"/);
  assert.match(source, /發佈文章/);
  assert.match(source, /取消發佈/);
});
