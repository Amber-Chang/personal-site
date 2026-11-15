import assert from "node:assert/strict";
import test from "node:test";

type EditState = { selectionEnd: number; selectionStart: number; value: string };

type ImageMarkdownModule = {
  CONTENT_IMAGE_ALT_REQUIRED_ERROR: string;
  CONTENT_IMAGE_FILE_REQUIRED_ERROR: string;
  createImageMarkdown: (alt: string, url: string) => string;
  escapeImageAlt: (alt: string) => string;
  getContentImageAltError: (alt: string) => string | null;
  getContentImageFileError: (file: { size: number; type: string } | null) => string | null;
  insertImageMarkdown: (input: EditState & { hasCursor: boolean }, markdown: string) => EditState;
};

async function loadModule(): Promise<ImageMarkdownModule> {
  const loadedModule = await import("./image-markdown.ts").catch(() => null);

  assert.ok(loadedModule, "expected image markdown module to exist at ./image-markdown.ts");

  return loadedModule as ImageMarkdownModule;
}

test("the selected file must exist, be an allowed type and be at most 5MB", async () => {
  const { CONTENT_IMAGE_FILE_REQUIRED_ERROR, getContentImageFileError } = await loadModule();

  assert.equal(getContentImageFileError(null), CONTENT_IMAGE_FILE_REQUIRED_ERROR);
  assert.equal(CONTENT_IMAGE_FILE_REQUIRED_ERROR, "請先選擇要上傳的圖片。");
  assert.equal(getContentImageFileError({ size: 1000, type: "image/png" }), null);
  assert.equal(getContentImageFileError({ size: 5_242_880, type: "image/gif" }), null);
  assert.equal(getContentImageFileError({ size: 1000, type: "image/svg+xml" }), "只能上傳 PNG、JPG、WebP 或 GIF 圖片。");
  assert.equal(getContentImageFileError({ size: 1000, type: "" }), "只能上傳 PNG、JPG、WebP 或 GIF 圖片。");
  assert.equal(getContentImageFileError({ size: 5_242_881, type: "image/jpeg" }), "圖片不能超過 5MB。");
  assert.equal(getContentImageFileError({ size: 0, type: "image/webp" }), "圖片不能超過 5MB。");
});

test("alt text is required and whitespace alone does not count", async () => {
  const { CONTENT_IMAGE_ALT_REQUIRED_ERROR, getContentImageAltError } = await loadModule();

  assert.equal(CONTENT_IMAGE_ALT_REQUIRED_ERROR, "請輸入圖片的替代文字。");
  assert.equal(getContentImageAltError(""), CONTENT_IMAGE_ALT_REQUIRED_ERROR);
  assert.equal(getContentImageAltError(" \n\t "), CONTENT_IMAGE_ALT_REQUIRED_ERROR);
  assert.equal(getContentImageAltError("流程圖"), null);
});

test("alt text escapes brackets and backslashes and folds line breaks into spaces", async () => {
  const { escapeImageAlt } = await loadModule();

  assert.equal(escapeImageAlt("  流程圖  "), "流程圖");
  assert.equal(escapeImageAlt("步驟 [1] 到 [2]"), "步驟 \\[1\\] 到 \\[2\\]");
  assert.equal(escapeImageAlt("第一行\n第二行\r\n第三行\r第四行"), "第一行 第二行 第三行 第四行");
  assert.equal(escapeImageAlt("結尾是反斜線\\"), "結尾是反斜線\\\\");
  assert.equal(escapeImageAlt("多個   空白"), "多個 空白");
});

test("image markdown keeps the syntax intact even with tricky alt text", async () => {
  const { createImageMarkdown } = await loadModule();
  const url = "https://project.supabase.co/storage/v1/object/public/content-images/a.png";

  assert.equal(createImageMarkdown("流程圖", url), `![流程圖](${url})`);
  assert.equal(createImageMarkdown("a ] (b) [c\nd", url), `![a \\] (b) \\[c d](${url})`);
  assert.equal(createImageMarkdown("x", "https://e.test/a b(1).png"), "![x](https://e.test/a%20b%281%29.png)");
});

test("with a cursor the image goes exactly at the caret and the caret moves after it", async () => {
  const { insertImageMarkdown } = await loadModule();

  assert.deepEqual(insertImageMarkdown({ hasCursor: true, selectionEnd: 3, selectionStart: 3, value: "前文。後文" }, "![a](u)"), {
    selectionEnd: 10,
    selectionStart: 10,
    value: "前文。![a](u)後文",
  });
  assert.deepEqual(insertImageMarkdown({ hasCursor: true, selectionEnd: 0, selectionStart: 0, value: "" }, "![a](u)"), {
    selectionEnd: 7,
    selectionStart: 7,
    value: "![a](u)",
  });
});

test("with a selection the image goes after the selection without deleting the selected text", async () => {
  const { insertImageMarkdown } = await loadModule();

  assert.deepEqual(insertImageMarkdown({ hasCursor: true, selectionEnd: 4, selectionStart: 0, value: "選取文字其他" }, "![a](u)"), {
    selectionEnd: 11,
    selectionStart: 11,
    value: "選取文字![a](u)其他",
  });
});

test("without a cursor the image is added at the end as its own paragraph", async () => {
  const { insertImageMarkdown } = await loadModule();
  const insert = (value: string) =>
    insertImageMarkdown({ hasCursor: false, selectionEnd: 0, selectionStart: 0, value }, "![a](u)").value;

  assert.equal(insert(""), "![a](u)");
  assert.equal(insert("段落"), "段落\n\n![a](u)");
  assert.equal(insert("段落\n"), "段落\n\n![a](u)");
  assert.equal(insert("段落\n\n"), "段落\n\n![a](u)");
  assert.deepEqual(insertImageMarkdown({ hasCursor: false, selectionEnd: 0, selectionStart: 0, value: "段落" }, "![a](u)"), {
    selectionEnd: 11,
    selectionStart: 11,
    value: "段落\n\n![a](u)",
  });
});
