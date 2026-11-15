import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string) {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const TOOLBAR = "src/components/admin/markdown-toolbar.tsx";

test("the toolbar offers every agreed button with a visible label", () => {
  const source = readSource(TOOLBAR);

  for (const label of ["粗體", "斜體", "大標", "小標", "連結", "引言", "項目清單", "編號清單", "表格", "程式碼區塊", "Mermaid 圖表", "圖片"]) {
    assert.match(source, new RegExp(`label: "${label}"`), label);
  }

  assert.match(source, /title: "粗體（Cmd\/Ctrl\+B）"/);
  assert.match(source, /title: "斜體（Cmd\/Ctrl\+I）"/);
  assert.match(source, /title: "連結（Cmd\/Ctrl\+K）"/);
});

test("toolbar buttons never submit the form, are disabled while saving and keep the textarea selection", () => {
  const source = readSource(TOOLBAR);

  assert.match(source, /^"use client";/);
  assert.equal(source.match(/<button/g)?.length, 1);
  assert.match(source, /type="button"/);
  assert.match(source, /disabled=\{disabled\}/);
  assert.match(source, /onMouseDown=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.match(source, /title=\{action\.title\}/);
});

test("the toolbar is a named role=toolbar group with arrow-key navigation and visible focus", () => {
  const source = readSource(TOOLBAR);

  assert.match(source, /role="toolbar"/);
  assert.match(source, /aria-label="Markdown 工具列"/);
  assert.match(source, /aria-controls=\{controls\}/);
  assert.match(source, /tabIndex=\{index === activeIndex \? 0 : -1\}/);
  for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
    assert.match(source, new RegExp(`\\b${key}:`));
  }
  assert.match(source, /focus-visible:outline-2/);
});

test("MarkdownContentField wires the toolbar, shortcuts and the image button to its own textarea", () => {
  const source = readSource("src/components/admin/markdown-content-field.tsx");

  assert.match(source, /<MarkdownToolbar/);
  assert.match(source, /onKeyDown=\{handleKeyDown\}/);
  assert.match(source, /getToolbarShortcut\(event\)/);
  assert.match(source, /applyTextareaEdit\(textarea, edit\(getEditState\(textarea\)\)\)/);
  // 圖片按鈕：把焦點移到上傳區塊的選檔欄位並捲到畫面內，本身不插入文字。
  assert.match(source, /scrollIntoView\(/);
  assert.match(source, /fileInput\.focus\(\)/);
  assert.match(source, /fileInputId=\{fileInputId\}/);
});
