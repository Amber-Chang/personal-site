import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const UPLOAD_SOURCE = "src/components/admin/content-image-upload.tsx";

test("the upload block has a file input, a required alt text input and an upload button", () => {
  const source = readSource(UPLOAD_SOURCE);

  assert.match(source, /^"use client";/);
  assert.match(source, />\s*上傳圖片\s*</);
  assert.match(source, /type="file"/);
  assert.match(source, /accept=\{CONTENT_IMAGE_TYPES\.join\(","\)\}/);
  assert.match(source, /替代文字/);
  assert.match(source, /<button[\s\S]*?type="button"/);
  // 上傳區塊放在文章表單裡：欄位不帶 name，不會跟著表單送出；也不用 HTML required，避免擋住儲存。
  assert.doesNotMatch(source, /\bname=/);
  assert.doesNotMatch(source, /\brequired\b/);
});

test("the upload block validates before sending and shows the agreed messages", () => {
  const source = readSource(UPLOAD_SOURCE);

  // 選檔當下就檢查類型與大小；按上傳時再檢查一次，並檢查替代文字。
  assert.match(source, /getContentImageFileError\(selected\)/);
  assert.match(source, /getContentImageFileError\(file\)/);
  assert.match(source, /getContentImageAltError\(alt\)/);
  assert.match(source, /role="alert"/);
});

test("uploading disables the button, shows progress and inserts markdown only after success", () => {
  const source = readSource(UPLOAD_SOURCE);

  assert.match(source, /disabled=\{disabled \|\| pending\}/);
  assert.match(source, /上傳中\.\.\./);
  assert.match(source, /requestContentImageUpload/);
  assert.match(source, /uploadFileToSignedUrl/);
  assert.match(source, /onUploaded\(createImageMarkdown\(alt, publicUrl\)\)/);
  // 成功後清空選檔與替代文字。
  assert.match(source, /setAlt\(""\)/);
  assert.match(source, /fileInputRef\.current\.value = ""/);
});

test("pressing Enter in the alt text field uploads instead of submitting the article form", () => {
  const source = readSource(UPLOAD_SOURCE);

  assert.match(source, /event\.key === "Enter"/);
  assert.match(source, /event\.preventDefault\(\)/);
});
