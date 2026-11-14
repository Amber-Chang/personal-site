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
  assert.match(source, /已上架專案會出現在文章關聯選單，也會成為公開案例來源/);
  assert.doesNotMatch(source, /這個表單目前只管理專案 identity/);
});

test("AdminProjectForm shows product-language status and guarded delete copy", () => {
  const filePath = path.join(process.cwd(), "src/components/admin/project-form.tsx");
  const source = fs.readFileSync(filePath, "utf8");

  assert.match(source, /ContentStatusBadge status=\{input\.values\.status\}/);
  assert.match(source, /option value="draft">\{getContentStatusLabel\("draft"\)\}/);
  assert.match(source, /option value="published">\{getContentStatusLabel\("published"\)\}/);
  assert.match(source, /需先下架才能刪除/);
  assert.match(source, /刪除專案/);
});

test("AdminProjectForm has a required project type select built from the shared options", () => {
  const filePath = path.join(process.cwd(), "src/components/admin/project-form.tsx");
  const source = fs.readFileSync(filePath, "utf8");

  assert.match(source, /<select[^>]*name="projectType"[^>]*required/);
  assert.match(source, /defaultValue=\{input\.values\.projectType\}/);
  assert.match(source, /<option disabled value="">請選擇類型<\/option>/);
  assert.match(source, /PROJECT_TYPE_OPTIONS\.map\(/);
  assert.match(source, /from "\.\.\/\.\.\/lib\/content\/project-type\.ts"/);
});

test("new and edit project pages pass a project type value to the form", () => {
  const newPage = fs.readFileSync(path.join(process.cwd(), "src/app/admin/projects/new/page.tsx"), "utf8");
  const editPage = fs.readFileSync(path.join(process.cwd(), "src/app/admin/projects/[id]/page.tsx"), "utf8");

  // 新增時不預選，逼使用者明確選一個；編輯時帶入現值，讀到不認得的值時回到未選。
  assert.match(newPage, /projectType: "",/);
  assert.match(editPage, /projectType: data\.project\.projectType \?\? "",/);
});
