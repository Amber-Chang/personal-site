import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

test("AdminPostForm exposes publish and unpublish buttons instead of a status dropdown", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/admin/post-form.tsx"), "utf8");

  assert.doesNotMatch(source, /<select[\s\S]*name="status"/);
  assert.match(source, /<input name="intent" type="hidden" value=\{submitIntent\} \/>/);
  assert.match(source, /setSubmitIntent\("publish"\)/);
  assert.match(source, /setSubmitIntent\("draft"\)/);
  assert.match(source, /發佈文章/);
  assert.match(source, /取消發佈/);
});

test("AdminPostForm includes helper copy for key content fields", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/admin/post-form.tsx"), "utf8");

  assert.match(source, /文章標題，會顯示在列表頁和單篇頁最上方。/);
  assert.match(source, /網址識別字/);
  assert.match(source, /文章摘要，會顯示在 blog 列表和首頁 writing 區塊。/);
  assert.match(source, /文章正文內容，支援 Markdown 語法。/);
  assert.match(source, /選填。需要時可把文章關聯到一個案例/);
});

test("AdminPostForm shows product-language status and guarded delete copy", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/components/admin/post-form.tsx"), "utf8");

  assert.match(source, /ContentStatusBadge status=\{input\.values\.status\}/);
  assert.match(source, /已上架/);
  assert.match(source, /未上架/);
  assert.match(source, /需先下架才能刪除/);
  assert.match(source, /刪除文章/);
});
