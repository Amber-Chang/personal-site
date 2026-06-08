import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("AdminProjectForm includes minimum identity fields and helper copy", () => {
  const filePath = path.join(process.cwd(), "src/components/admin/project-form.tsx");
  const source = fs.readFileSync(filePath, "utf8");

  assert.match(source, /Project Admin/);
  assert.match(source, /name="title"/);
  assert.match(source, /name="slug"/);
  assert.match(source, /name="summary"/);
  assert.match(source, /name="status"/);
  assert.match(source, /這個表單目前只管理專案 identity/);
  assert.match(source, /published project 會出現在文章關聯選單/);
});
