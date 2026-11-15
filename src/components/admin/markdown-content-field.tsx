"use client";

// 功能：文章與專案表單共用的 Markdown 內容欄位：工具列、textarea、預覽，以及旁邊的「上傳圖片」區塊。
// 寬螢幕（lg，64rem 以上）時內容欄位與預覽左右並排、停止輸入約 500 毫秒後更新；較窄時用「編輯／預覽」切換。
// textarea 維持原本的 id、name 與 defaultValue，跟著表單送出，資料格式不變（仍是純 Markdown）。
// 工具列、快捷鍵與上傳的圖片只作用在這個欄位（專案表單的摘要、成果等欄位不受影響）。

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type ChangeEvent, type KeyboardEvent } from "react";

import { insertImageMarkdown } from "../../lib/content-images/image-markdown.ts";
import type { TextEditState } from "../../lib/markdown/text-edits.ts";
import { getToolbarShortcut, insertLink, wrapBold, wrapItalic } from "../../lib/markdown/toolbar-actions.ts";
import { ADMIN_EDITOR_NARROW_CHILDREN } from "./admin-editor-layout.ts";
import { ContentImageUpload } from "./content-image-upload.tsx";
import { MarkdownToolbar } from "./markdown-toolbar.tsx";
import { applyTextareaEdit } from "./textarea-edit.ts";

// 預覽第一次打開時才載入（含 Markdown 轉換與程式碼上色），平常編輯的頁面不必下載。
const MarkdownPreview = dynamic(() => import("./markdown-preview.tsx").then((module) => module.MarkdownPreview), {
  loading: () => <p className="text-sm text-black/55">預覽載入中...</p>,
  ssr: false,
});

const SHORTCUT_EDITS = { bold: wrapBold, italic: wrapItalic, link: insertLink };

// 並排預覽的寬度門檻，與 Tailwind 的 lg 相同。
const WIDE_LAYOUT_QUERY = "(min-width: 64rem)";

// 停止輸入多久後更新並排預覽。
const PREVIEW_DEBOUNCE_MS = 500;

function subscribeToWideLayout(onChange: () => void) {
  const mediaQuery = window.matchMedia(WIDE_LAYOUT_QUERY);

  mediaQuery.addEventListener("change", onChange);

  return () => mediaQuery.removeEventListener("change", onChange);
}

function getWideLayoutSnapshot() {
  return window.matchMedia(WIDE_LAYOUT_QUERY).matches;
}

const toggleButtonClassName =
  "rounded-full px-4 py-1.5 text-sm font-medium transition aria-pressed:bg-black aria-pressed:text-white text-black/65 hover:text-black";

export function MarkdownContentField(input: {
  defaultValue: string;
  description: string;
  // 表單送出中時停用工具列與上傳。
  disabled: boolean;
  id: string;
  label: string;
  name: string;
  textareaClassName: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 使用者點過內容欄位後才算有游標；之前插入的圖片會加在最後。
  const cursorPlacedRef = useRef(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [previewContent, setPreviewContent] = useState(input.defaultValue);
  const fileInputId = `${useId()}-image-file`;
  // 伺服器端與第一次畫面先當成窄螢幕，載入後依實際寬度切換。
  const isWide = useSyncExternalStore(subscribeToWideLayout, getWideLayoutSnapshot, () => false);
  const previewTimerRef = useRef<number | undefined>(undefined);
  const showPreviewPane = isWide || mode === "preview";

  useEffect(() => () => window.clearTimeout(previewTimerRef.current), []);

  // 每次輸入（含工具列與上傳插入的文字）後重新計時，停下來約 500 毫秒才更新預覽，避免每個按鍵都重新輸出。
  function handleContentChange(event: ChangeEvent<HTMLTextAreaElement>) {
    const value = event.target.value;

    window.clearTimeout(previewTimerRef.current);
    previewTimerRef.current = window.setTimeout(() => setPreviewContent(value), PREVIEW_DEBOUNCE_MS);
  }

  function showPreview() {
    // 預覽的是 textarea 目前的文字（含尚未儲存的修改）；只讀，不改表單內容。
    setPreviewContent(textareaRef.current?.value ?? "");
    setMode("preview");
  }

  // 還沒點過內容欄位時，把游標當成在最後面。
  function getEditState(textarea: HTMLTextAreaElement): TextEditState {
    if (!cursorPlacedRef.current) {
      return { selectionEnd: textarea.value.length, selectionStart: textarea.value.length, value: textarea.value };
    }

    return { selectionEnd: textarea.selectionEnd, selectionStart: textarea.selectionStart, value: textarea.value };
  }

  // 工具列與快捷鍵的修改：透過 insertText 寫回，Cmd/Ctrl+Z 可以復原。
  function runEdit(edit: (state: TextEditState) => TextEditState) {
    const textarea = textareaRef.current;

    if (!textarea || input.disabled) {
      return;
    }

    applyTextareaEdit(textarea, edit(getEditState(textarea)));
    cursorPlacedRef.current = true;
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    const shortcut = getToolbarShortcut(event);

    if (!shortcut) {
      return;
    }

    event.preventDefault();
    runEdit(SHORTCUT_EDITS[shortcut]);
  }

  // 工具列的「圖片」：把焦點移到上傳區塊的選檔欄位，本身不插入文字。
  function focusImageUpload() {
    const fileInput = document.getElementById(fileInputId);

    if (fileInput) {
      fileInput.scrollIntoView({ behavior: "smooth", block: "center" });
      fileInput.focus();
    }
  }

  function insertImage(markdown: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const next = insertImageMarkdown(
      {
        hasCursor: cursorPlacedRef.current,
        selectionEnd: textarea.selectionEnd,
        selectionStart: textarea.selectionStart,
        value: textarea.value,
      },
      markdown,
    );

    applyTextareaEdit(textarea, next);
    cursorPlacedRef.current = true;
    // 上傳完成時預覽立刻更新（不用等輸入停止）。
    window.clearTimeout(previewTimerRef.current);
    setPreviewContent(textarea.value);
  }

  return (
    // 寬螢幕的編輯頁：標題列、工具列與上傳區塊維持原本寬度，只有編輯區與預覽那一列用滿寬度。
    <div className={`space-y-2 ${ADMIN_EDITOR_NARROW_CHILDREN}`} data-admin-wide>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-black" htmlFor={input.id}>
            {input.label}
          </label>
          <p className="text-xs leading-5 text-black/55">{input.description}</p>
        </div>
        {/* 寬螢幕時兩邊同時顯示，不需要切換。 */}
        {isWide ? null : (
          <div aria-label="內容欄位檢視方式" className="flex gap-1 rounded-full border border-black/10 p-1" role="group">
            <button aria-pressed={mode === "edit"} className={toggleButtonClassName} onClick={() => setMode("edit")} type="button">
              編輯
            </button>
            <button aria-pressed={mode === "preview"} className={toggleButtonClassName} onClick={showPreview} type="button">
              預覽
            </button>
          </div>
        )}
      </div>
      {isWide || mode === "edit" ? (
        <MarkdownToolbar controls={input.id} disabled={input.disabled} onEdit={runEdit} onImage={focusImageUpload} />
      ) : null}
      <div className={isWide ? "grid grid-cols-2 gap-4" : undefined} data-admin-wide>
        {/* 窄螢幕預覽時 textarea 只隱藏不卸載：未儲存的文字、游標位置與表單送出的值都保留。 */}
        <textarea
          className={input.textareaClassName}
          defaultValue={input.defaultValue}
          hidden={!isWide && mode === "preview"}
          id={input.id}
          name={input.name}
          onChange={handleContentChange}
          onFocus={() => {
            cursorPlacedRef.current = true;
          }}
          onKeyDown={handleKeyDown}
          ref={textareaRef}
        />
        {showPreviewPane ? (
          // 預覽區自己捲動、最高 70% 螢幕高，儲存按鈕仍容易按到；不和編輯區同步捲動。
          <section
            aria-label="預覽"
            className="min-h-64 max-h-[70vh] overflow-y-auto rounded-2xl border border-black/10 bg-white px-6 py-5"
          >
            <MarkdownPreview content={previewContent} />
          </section>
        ) : null}
      </div>
      <ContentImageUpload disabled={input.disabled} fileInputId={fileInputId} onUploaded={insertImage} />
    </div>
  );
}
