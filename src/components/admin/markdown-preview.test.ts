import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("the admin preview renders through the same Prose and MarkdownContent as the public pages", () => {
  const source = readSource("src/components/admin/markdown-preview.tsx");

  assert.match(source, /import \{ MarkdownContent \} from "\.\.\/MarkdownContent\.tsx";/);
  assert.match(source, /import \{ Prose \} from "\.\.\/Prose\.tsx";/);
  assert.match(source, /<Prose>\s*<MarkdownContent content=\{content\} \/>\s*<\/Prose>/);
  // 預覽只讀內容，不儲存、不發佈。
  assert.doesNotMatch(source, /fetch\(|action=|use server|formAction/);
});

test("MarkdownContentField toggles between editing and a lazily loaded preview without unmounting the textarea", () => {
  const source = readSource("src/components/admin/markdown-content-field.tsx");

  assert.match(source, /dynamic\(\(\) => import\("\.\/markdown-preview\.tsx"\)/);
  assert.match(source, />\s*編輯\s*</);
  assert.match(source, />\s*預覽\s*</);
  assert.match(source, /aria-pressed=\{mode === "edit"\}/);
  assert.match(source, /aria-pressed=\{mode === "preview"\}/);
  // textarea 只隱藏不卸載：未儲存的文字、游標位置與表單送出的值都保留。
  assert.match(source, /hidden=\{!isWide && mode === "preview"\}/);
  assert.match(source, /setPreviewContent\(textareaRef\.current\?\.value \?\? ""\)/);
  assert.match(source, /showPreviewPane \? \([\s\S]*?<section[\s\S]*?<MarkdownPreview content=\{previewContent\} \/>\s*<\/section>\s*\) : null/);
  // 切換按鈕不會送出表單。
  assert.equal(source.match(/type="button"/g)?.length, 2);
});

test("admin create and edit pages check admin access before rendering the form that holds the preview", () => {
  for (const page of [
    "src/app/admin/posts/new/page.tsx",
    "src/app/admin/posts/[id]/page.tsx",
    "src/app/admin/projects/new/page.tsx",
    "src/app/admin/projects/[id]/page.tsx",
  ]) {
    const source = readSource(page);

    assert.match(source, /await getAdminPageContentService\(\)/, page);
  }
});
