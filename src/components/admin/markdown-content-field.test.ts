import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const FIELD_SOURCE = "src/components/admin/markdown-content-field.tsx";

test("MarkdownContentField keeps a plain uncontrolled textarea that submits with the form", () => {
  const source = readSource(FIELD_SOURCE);

  assert.match(source, /^"use client";/);
  assert.match(source, /<textarea[\s\S]*?defaultValue=\{input\.defaultValue\}[\s\S]*?id=\{input\.id\}[\s\S]*?name=\{input\.name\}/);
  assert.match(source, /ref=\{textareaRef\}/);
});

test("MarkdownContentField inserts uploaded images at the caret of its own textarea", () => {
  const source = readSource(FIELD_SOURCE);

  // 點過內容欄位才算有游標；沒有游標時加在最後。
  assert.match(source, /onFocus=\{\(\) => \{\s*cursorPlacedRef\.current = true;\s*\}\}/);
  assert.match(source, /insertImageMarkdown\(/);
  assert.match(source, /hasCursor: cursorPlacedRef\.current/);
  assert.match(source, /applyTextareaEdit\(textarea, next\)/);
  assert.match(source, /<ContentImageUpload disabled=\{input\.disabled\} fileInputId=\{fileInputId\} onUploaded=\{insertImage\} \/>/);
});

test("post and project forms use MarkdownContentField only for their Markdown content field", () => {
  const postForm = readSource("src/components/admin/post-form.tsx");
  const projectForm = readSource("src/components/admin/project-form.tsx");

  assert.match(postForm, /<MarkdownContentField[\s\S]*?id="content_markdown"[\s\S]*?name="content_markdown"/);
  assert.match(postForm, /defaultValue=\{input\.values\.contentMarkdown\}/);
  assert.match(postForm, /disabled=\{pending\}/);
  assert.equal(postForm.match(/<MarkdownContentField/g)?.length, 1);

  assert.match(projectForm, /<MarkdownContentField[\s\S]*?id="contentMarkdown"[\s\S]*?name="contentMarkdown"/);
  assert.equal(projectForm.match(/<MarkdownContentField/g)?.length, 1);
  // 摘要與成果仍是一般 textarea，不會收到圖片。
  assert.match(projectForm, /<textarea[^>]*id="summary"/);
  assert.match(projectForm, /<textarea[^>]*id="outcomes"/);
});

test("at the lg breakpoint the content field and the preview sit side by side; below it the toggle stays", () => {
  const source = readSource(FIELD_SOURCE);

  // 用 matchMedia 判斷寬度（與 Tailwind 的 lg 相同：64rem）；伺服器端先當成窄螢幕。
  assert.match(source, /const WIDE_LAYOUT_QUERY = "\(min-width: 64rem\)";/);
  assert.match(source, /useSyncExternalStore\(subscribeToWideLayout, getWideLayoutSnapshot, \(\) => false\)/);
  assert.match(source, /isWide \? "grid grid-cols-2 gap-4" : undefined/);
  assert.match(source, /hidden=\{!isWide && mode === "preview"\}/);
  assert.match(source, /\{isWide \? null : \(/);
  assert.match(source, /const showPreviewPane = isWide \|\| mode === "preview";/);
});

test("the live preview updates about 500ms after typing stops and never writes back to the form", () => {
  const source = readSource(FIELD_SOURCE);

  assert.match(source, /const PREVIEW_DEBOUNCE_MS = 500;/);
  assert.match(source, /onChange=\{handleContentChange\}/);
  assert.match(source, /window\.setTimeout\(\(\) => setPreviewContent\(value\), PREVIEW_DEBOUNCE_MS\)/);
  assert.match(source, /window\.clearTimeout\(previewTimerRef\.current\)/);
  // 預覽只讀 textarea 的值；不在預覽裡設定 textarea 的值。
  assert.doesNotMatch(source, /textarea\.value =/);
});

test("the preview pane scrolls on its own with a capped height", () => {
  const source = readSource(FIELD_SOURCE);

  assert.match(source, /<section[\s\S]*?aria-label="預覽"/);
  assert.match(source, /max-h-\[70vh\] overflow-y-auto/);
});
