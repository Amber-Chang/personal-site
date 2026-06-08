import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("AdminProjectForm includes public project content fields and helper copy", () => {
  const filePath = path.join(process.cwd(), "src/components/admin/project-form.tsx");
  const source = fs.readFileSync(filePath, "utf8");

  assert.match(source, /Project Admin/);
  assert.match(source, /name="title"/);
  assert.match(source, /name="slug"/);
  assert.match(source, /name="summary"/);
  assert.match(source, /name="role"/);
  assert.match(source, /name="period"/);
  assert.match(source, /name="tags"/);
  assert.match(source, /name="outcomes"/);
  assert.match(source, /name="contentMarkdown"/);
  assert.match(source, /name="featured"/);
  assert.match(source, /name="status"/);
  assert.match(source, /published project 會出現在文章關聯選單，也會成為公開案例來源/);
  assert.doesNotMatch(source, /這個表單目前只管理專案 identity/);
});
